from flask import Flask, jsonify, request
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
import numpy as np
import os


app = Flask(__name__)
db = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))["securesync"]

# ─── Z-SCORE ───────────────────────────────────────────────────────────────────
def zscore(val, mean, std):
    return abs((val - mean) / std) if std > 0 else 0

# ─── EWMA ──────────────────────────────────────────────────────────────────────
def compute_ewma(values, alpha=0.3):
    """
    מחשב EWMA על רשימת ערכים.
    alpha קובע כמה משקל נותנים לנתונים האחרונים (0.3 = מאזן בין ישן לחדש).
    מחזיר את ה-EWMA האחרון (ערך ה"צפוי" הנוכחי).
    """
    if not values:
        return 0
    ewma = values[0]
    for v in values[1:]:
        ewma = alpha * v + (1 - alpha) * ewma
    return ewma

# ─── ISOLATION FOREST ──────────────────────────────────────────────────────────
def isolation_forest_score(features_matrix, new_point):
    """
    מאמן Isolation Forest על היסטוריה ומחשב ציון אנומליה לנקודה חדשה.
    מחזיר True אם הנקודה אנומלית.
    features_matrix: רשימה של [hour, downloads, deletes] לכל יום היסטורי.
    new_point: [hour, downloads, deletes] של היום.
    """
    if len(features_matrix) < 5:
        return False
    X = np.array(features_matrix)
    clf = IsolationForest(contamination=0.1, random_state=42)
    clf.fit(X)
    pred = clf.predict([new_point])
    return pred[0] == -1  # -1 = אנומליה

def one_class_svm_score(features_matrix, new_point):
    if len(features_matrix) < 5:
        return False
    X = np.array(features_matrix)
    clf = OneClassSVM(nu=0.1, kernel="rbf", gamma="auto")
    clf.fit(X)
    pred = clf.predict([new_point])
    return pred[0] == -1

# ─── BASELINE UPDATE ───────────────────────────────────────────────────────────
def update_baseline(user_id, logs):
    today = datetime.now().date()
    historical_logs = [l for l in logs if l["createdAt"].date() < today]
    if len(historical_logs) < 5:
        return

    hours = [l["createdAt"].hour for l in historical_logs]
    dl_by_day, del_by_day = {}, {}

    for l in historical_logs:
        day = l["createdAt"].date().isoformat()
        if l.get("action") == "download":
            dl_by_day[day] = dl_by_day.get(day, 0) + 1
        if l.get("action") == "delete":
            del_by_day[day] = del_by_day.get(day, 0) + 1

    dl_values = list(dl_by_day.values()) or [0]
    del_values = list(del_by_day.values()) or [0]

    db.baselineprofiles.update_one({"userId": user_id}, {"$set": {
        "userId": user_id,
        "avgHour": float(np.mean(hours)),
        "stdHour": float(np.std(hours)),
        "avgDl": float(np.mean(dl_values)),
        "stdDl": float(np.std(dl_values)),
        "avgDel": float(np.mean(del_values)),
        "stdDel": float(np.std(del_values)),
        "ewmaDl": float(compute_ewma(dl_values)),
        "ewmaDel": float(compute_ewma(del_values)),
        "updatedAt": datetime.now(),
    }}, upsert=True)

# ─── ANALYZE ───────────────────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    user_id = data.get("userId")
    action  = data.get("action")

    try:
        uid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "invalid userId"}), 400

    logs = list(db.auditlogs.find({"userId": uid}).sort("createdAt", 1))
    for l in logs:
        if isinstance(l.get("createdAt"), datetime):
            pass
        else:
            l["createdAt"] = datetime.now()

    update_baseline(user_id, logs)

    baseline = db.baselineprofiles.find_one({"userId": user_id})
    if not baseline:
        return jsonify({"anomaly": False, "reason": "no baseline yet"})

    now = datetime.now()
    today = now.date()

    # נתוני היום בלבד
    today_logs = [l for l in logs if l["createdAt"].date() == today]
    today_dl  = sum(1 for l in today_logs if l.get("action") == "download")
    today_del = sum(1 for l in today_logs if l.get("action") == "delete")
    current_hour = now.hour

    # ── Z-SCORE ──
    z_hour = zscore(current_hour, baseline["avgHour"], baseline["stdHour"])
    z_dl   = zscore(today_dl,    baseline["avgDl"],   baseline["stdDl"])
    z_del  = zscore(today_del,   baseline["avgDel"],  baseline["stdDel"])
    z_score = max(z_hour, z_dl, z_del)

    # ── EWMA ──
    # ציון EWMA: סטייה של ערך היום מה-EWMA ההיסטורי
    ewma_dl_expected  = baseline.get("ewmaDl",  baseline["avgDl"])
    ewma_del_expected = baseline.get("ewmaDel", baseline["avgDel"])
    ewma_dl_dev  = abs(today_dl  - ewma_dl_expected)
    ewma_del_dev = abs(today_del - ewma_del_expected)
    ewma_anomaly = (ewma_dl_dev > 2 * baseline["stdDl"] + 20) or \
               (ewma_del_dev > 2 * baseline["stdDel"] + 20)

    # ── ISOLATION FOREST ──
    historical_logs = [l for l in logs if l["createdAt"].date() < today]
    dl_by_day, del_by_day = {}, {}
    hours_by_day = {}
    for l in historical_logs:
        day = l["createdAt"].date().isoformat()
        if l.get("action") == "download":
            dl_by_day[day] = dl_by_day.get(day, 0) + 1
        if l.get("action") == "delete":
            del_by_day[day] = del_by_day.get(day, 0) + 1
        hours_by_day.setdefault(day, []).append(l["createdAt"].hour)

    all_days = sorted(set(list(dl_by_day.keys()) + list(del_by_day.keys()) + list(hours_by_day.keys())))
    features_matrix = [
        [
            np.mean(hours_by_day.get(d, [12])),
            dl_by_day.get(d, 0),
            del_by_day.get(d, 0)
        ]
        for d in all_days
    ]
    new_point = [current_hour, today_dl, today_del]
    if_anomaly = isolation_forest_score(features_matrix, new_point)
    svm_anomaly = one_class_svm_score(features_matrix, new_point)

    # ── החלטה סופית ──
    anomaly = (z_score > 2) or if_anomaly or bool(svm_anomaly)
    score_doc = {
        "userId": user_id,
        "action": action,
        "zScore": round(z_score, 3),
        "ewmaAnomaly": bool(ewma_anomaly),
        "isolationForestAnomaly": bool(if_anomaly),
        "anomaly": bool(anomaly),
        "details": f"z={round(z_score,2)} | ewma_dl_dev={round(ewma_dl_dev,2)} ewma_del_dev={round(ewma_del_dev,2)} | IF={if_anomaly}",
        "createdAt": now,
        "svmAnomaly": bool(svm_anomaly),
    }

    if anomaly:
        db.anomalyscores.insert_one(score_doc)

    return jsonify({
        "anomaly": bool(anomaly),
        "zScore": round(z_score, 3),
        "ewmaAnomaly": bool(ewma_anomaly),
        "isolationForestAnomaly": bool(if_anomaly),
        "details": score_doc["details"],
        "svmAnomaly": bool(svm_anomaly),
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)