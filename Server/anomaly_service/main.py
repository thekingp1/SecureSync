from flask import Flask, jsonify, request
from pymongo import MongoClient
from datetime import datetime, timedelta
import numpy as np
import os
app = Flask(__name__)
db = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))["securesync"]
def Zscore(val, mean, std):
    return abs((val-mean) / std) if std>0 else 0

def update_baseline(user_id, logs):
    if len(logs) < 5:
        return 
    hours = [l["createdAt"].hour for l in logs]
    d1_by_day, del_by_day = {}, {}
    for l in logs:
        day = l["createdAt"].date().isoformat()
        if l.get("action") == "download":
            d1_by_day[day] = d1_by_day.get(day,0) + 1
        if l.get("action") == "delete":
            del_by_day[day] = del_by_day.get(day,0) + 1
    db.baselineprofiles.update_one({"userId": user_id}, {"$set": {
        "userId": user_id,
        "avgHour":   float(np.mean(hours)),
        "stdHour":   float(np.std(hours)),
        "avgDl":     float(np.mean(list(d1_by_day.values())  or [0])),
        "stdDl":     float(np.std(list(d1_by_day.values())   or [0])),
        "avgDel":    float(np.mean(list(del_by_day.values()) or [0])),
        "stdDel":    float(np.std(list(del_by_day.values())  or [0])),
        "updatedAt": datetime.now(),
    }}, upsert= True)

@app.route("/health")
def health():
    return jsonify({"status": "ok"})
@app.route("/analyze", methods=["POST"])
def analyze():
     data = request.json
     user_id = data["userId"]
     action = data["action"]
     ts = datetime.fromisoformat(data["timestamp"])
     hour = ts.hour
     today = ts.date()
     
     since = datetime.now() - timedelta(days=30)
     logs = list(db.auditlogs.find({"userId": user_id, "createdAt": {"$gte": since}}))

     update_baseline(user_id,logs)
     baseline = db.baselineprofiles.find_one({"userId": user_id})

     score, details = 0.0, []
# hour anomaly
     if baseline:
         h_score = Zscore(hour, baseline["avgHour"], baseline["stdHour"])
         if h_score > 2:
             details.append(f"Unusual hour: {hour}:00 (avg {baseline['avgHour']:.0f}:00)")
             score += h_score
# download anomaly
         if action == "download":
             count = sum(1 for l in logs if l.get("action") == "download" and l["createdAt"].date()==today)
             d_score = Zscore(count, baseline["avgDl"], baseline["stdDl"])
             if d_score > 2:
                 details.append(f"high downloads: {count} today (avg {baseline['avgDl']:.1f}/day)")
                 score += d_score
# deletet anomaly
         if action == "delete":
             count = sum(1 for l in logs if l.get("action") =="delete" and l["createdAt"].date()== today)
             d_score = Zscore(count, baseline["avgDel"], baseline["stdDel"])
             if d_score >2:
                 details.append(f"mass deletion: {count} today (avg {baseline['avgDel']:.1f}/day)")
                 score +=d_score
     anomaly = score>2
     if anomaly:
         db.anomalyscores.insert_one({
             "userId": user_id,
             "action": action,
             "score" : round(score,2),
             "method": "z-score",
             "details": details,
             "detectedAt": datetime.now(),
         }) 
     return jsonify({"score": round(score,2), "anomaly": anomaly, "details": details})
@app.route("/score/<user_id>")
def scores(user_id):
    docs = list(db.anomalyscores.find({"userId": user_id}, {"_id": 0})
                .sort("detectedAt", -1).limit(20))
    return jsonify(docs)
if __name__ == "__main__":
    app.run(port=5001)