from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
import random

db = MongoClient("mongodb://localhost:27017")["securesync"]

# שנה את זה ל-userId האמיתי שלך
USER_ID = "69ffa2f2c270037ed1c64147"

actions = ["upload", "download", "download", "delete", "download"]

docs = []
for days_ago in range(1, 15):  # 14 ימים אחורה
    date = datetime.now() - timedelta(days=days_ago)
    for _ in range(random.randint(2, 6)):
        docs.append({
            "userId": ObjectId(USER_ID),
            "action": random.choice(actions),
            "createdAt": date.replace(hour=random.randint(8, 20), minute=random.randint(0, 59)),
        })

db.auditlogs.insert_many(docs)
print(f"הוספנו {len(docs)} לוגים היסטוריים")