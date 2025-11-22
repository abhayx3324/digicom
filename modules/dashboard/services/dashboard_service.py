from datetime import datetime, timedelta, timezone
from commons.serializers.collections import Collections
from commons.utils.db import db
from bson import ObjectId

async def get_admin_dashboard_data_service():
    complaints_col = db.get_collection(Collections.COMPLAINT)

    # ---------- BASIC COUNTS ----------
    total = await complaints_col.count_documents({})
    open_c = await complaints_col.count_documents({"status": "OPEN"})
    in_progress = await complaints_col.count_documents({"status": "IN_PROGRESS"})
    resolved = await complaints_col.count_documents({"status": "RESOLVED"})
    closed = await complaints_col.count_documents({"status": "CLOSED"})
    rejected = await complaints_col.count_documents({"status": "REJECTED"})

    # ---------- LAST 24 HOURS ----------
    last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    last_24h_count = await complaints_col.count_documents({"createdAt": {"$gte": last_24h}})

    # ---------- RECENT COMPLAINTS ----------
    recent_cursor = complaints_col.find(
        {},
        {"title": 1, "status": 1, "createdAt": 1}
    ).sort("createdAt", -1).limit(5)

    recent_list = []
    async for r in recent_cursor:
        r["id"] = str(r.pop("_id"))
        recent_list.append(r)

    # ---------- COMPLAINTS PER DAY (LAST 7 DAYS) ----------
    last_7_days = datetime.now(timezone.utc) - timedelta(days=7)
    pipeline_7d = [
        {"$match": {"createdAt": {"$gte": last_7_days}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    per_day_7 = await complaints_col.aggregate(pipeline_7d).to_list(None)

    # ---------- COMPLAINTS PER DAY (LAST 30 DAYS) ----------
    last_30_days = datetime.now(timezone.utc) - timedelta(days=30)
    pipeline_30d = [
        {"$match": {"createdAt": {"$gte": last_30_days}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    per_day_30 = await complaints_col.aggregate(pipeline_30d).to_list(None)

    # ---------- TOP USERS BY COMPLAINT COUNT ----------
    pipeline_top_users = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_users = await complaints_col.aggregate(pipeline_top_users).to_list(None)
    for u in top_users:
        u["user_id"] = u.pop("_id")

    # ---------- COMPLETION RATE ----------
    completed = resolved + closed
    completion_rate = (completed / total * 100) if total > 0 else 0

    # ---------- AGING BUCKETS ----------
    now = datetime.now(timezone.utc)

    pipeline_aging = [
        {"$project": {
            "status": 1,
            "ageHours": {
                "$divide": [
                    {"$subtract": [now, "$createdAt"]},
                    1000 * 60 * 60
                ]
            }
        }}
    ]

    aging_docs = await complaints_col.aggregate(pipeline_aging).to_list(None)
    aging_buckets = {
        "<24h": 0,
        "1-3d": 0,
        "3-7d": 0,
        ">7d": 0
    }

    for doc in aging_docs:
        hours = doc["ageHours"]
        if hours < 24:
            aging_buckets["<24h"] += 1
        elif hours < 72:
            aging_buckets["1-3d"] += 1
        elif hours < 168:
            aging_buckets["3-7d"] += 1
        else:
            aging_buckets[">7d"] += 1

    # ---------- LONGEST OPEN COMPLAINTS ----------
    longest_open_cursor = complaints_col.find(
        {"status": "OPEN"},
        {"title": 1, "createdAt": 1}
    ).sort("createdAt", 1).limit(5)

    longest_open = []
    async for c in longest_open_cursor:
        c["id"] = str(c.pop("_id"))
        longest_open.append(c)

    # ---------- ADMIN EFFICIENCY SCORE ----------
    efficiency_score = completion_rate  # simplified model

    return {
        "totalComplaints": total,
        "statusCounts": {
            "OPEN": open_c,
            "IN_PROGRESS": in_progress,
            "RESOLVED": resolved,
            "CLOSED": closed,
            "REJECTED": rejected,
        },
        "last24hComplaints": last_24h_count,
        "recentComplaints": recent_list,

        "complaintsPerDay7": per_day_7,
        "complaintsPerDay30": per_day_30,

        "topUsers": top_users,

        "completionRate": completion_rate,

        "agingBuckets": aging_buckets,

        "longestOpenComplaints": longest_open,

        "adminEfficiencyScore": efficiency_score
    }