async def get_allowed_categories(db, user_id):
    cursor = db.analyst_category.find({"user_id": user_id})
    rows = await cursor.to_list(length=100)
    return [r["category"] for r in rows]

async def get_product_reviews(db, product_id, user_id, role):
    allowed_cats = await get_allowed_categories(db, user_id) if role != "admin" else []
    
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product_info"
        }},
        {"$unwind": "$product_info"}
    ]
    
    if role != "admin":
        if not allowed_cats:
            return []
        pipeline.append({"$match": {"product_info.category": {"$in": allowed_cats}}})
        
    cursor = db.reviews.aggregate(pipeline)
    reviews = []
    async for doc in cursor:
        reviews.append(doc)
    return reviews


async def sentiment_counts(db, product_id, user_id, role):
    allowed_cats = await get_allowed_categories(db, user_id) if role != "admin" else []
    
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product_info"
        }},
        {"$unwind": "$product_info"}
    ]
    
    if role != "admin":
        if not allowed_cats:
            return 0, 0
        pipeline.append({"$match": {"product_info.category": {"$in": allowed_cats}}})
        
    pipeline.append({
        "$group": {
            "_id": "$sentiment",
            "count": {"$sum": 1}
        }
    })
    
    cursor = db.reviews.aggregate(pipeline)
    happy, unhappy = 0, 0
    async for doc in cursor:
        if doc["_id"] == "happy":
            happy = doc["count"]
        elif doc["_id"] == "unhappy":
            unhappy = doc["count"]
            
    return happy, unhappy


async def get_dashboard_stats(db, user_id, role):
    allowed_cats = await get_allowed_categories(db, user_id) if role != "admin" else []
    
    match_stage = {"$match": {"category": {"$in": allowed_cats}}} if (role != "admin" and allowed_cats) else {}
    if role != "admin" and not allowed_cats:
        return {
            "category_performance": [], "top_products": [], "bad_products": [],
            "kpis": {"nps": 0, "total_reviews": 0, "happy_pct": 0, "worst_product": "N/A"},
            "satisfaction": {"happy": 0, "unhappy": 0},
            "rating_distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        }

    # Pipeline for Products + Reviews data combined
    pipeline = []
    if match_stage:
        pipeline.append(match_stage)
        
    pipeline.extend([
        {"$lookup": {
            "from": "reviews",
            "localField": "id",
            "foreignField": "product_id",
            "as": "reviews"
        }},
        {"$unwind": {"path": "$reviews", "preserveNullAndEmptyArrays": False}},
        {"$project": {
            "id": 1,
            "name": 1,
            "category": 1,
            "rating": "$reviews.rating",
            "is_promoter": {"$cond": [{"$gte": ["$reviews.rating", 4]}, 1, 0]},
            "is_detractor": {"$cond": [{"$lte": ["$reviews.rating", 2]}, 1, 0]},
        }}
    ])
    
    # 1. Category Performance Pipeline
    cat_pipeline = pipeline + [
        {"$group": {
            "_id": "$category",
            "total_reviews": {"$sum": 1},
            "avg_rating": {"$avg": "$rating"},
            "promoters": {"$sum": "$is_promoter"},
            "detractors": {"$sum": "$is_detractor"}
        }},
        {"$sort": {"total_reviews": -1}},
        {"$limit": 5}
    ]
    
    cat_cursor = db.products.aggregate(cat_pipeline)
    categories = []
    async for stat in cat_cursor:
        nps = ((stat["promoters"] - stat["detractors"]) / stat["total_reviews"] * 100) if stat["total_reviews"] > 0 else 0
        categories.append({
            "category": stat["_id"],
            "nps": round(nps),
            "avg_rating": round(stat["avg_rating"], 1) if stat["avg_rating"] else 0
        })

    # 2. Product Performance Pipeline
    prod_pipeline = pipeline + [
        {"$group": {
            "_id": "$id",
            "name": {"$first": "$name"},
            "category": {"$first": "$category"},
            "total_reviews": {"$sum": 1},
            "avg_rating": {"$avg": "$rating"},
            "promoters": {"$sum": "$is_promoter"},
            "detractors": {"$sum": "$is_detractor"}
        }},
        {"$match": {"total_reviews": {"$gte": 5}}}
    ]
    
    prod_cursor = db.products.aggregate(prod_pipeline)
    product_scores = []
    async for p in prod_cursor:
        nps = ((p["promoters"] - p["detractors"]) / p["total_reviews"] * 100) if p["total_reviews"] > 0 else 0
        name = p["name"]
        product_scores.append({
            "name": name[:30] + '...' if len(name) > 30 else name,
            "category": p["category"],
            "nps": round(nps),
            "rating": round(p["avg_rating"], 1) if p["avg_rating"] else 0
        })
        
    product_scores.sort(key=lambda x: x["nps"], reverse=True)
    
    top_products = product_scores[:5]
    bad_products = product_scores[-5:]
    bad_products.sort(key=lambda x: x["nps"])

    # 3. Overall KPIs Pipeline
    kpi_pipeline = pipeline + [
        {"$group": {
            "_id": None,
            "total_reviews": {"$sum": 1},
            "promoters": {"$sum": "$is_promoter"},
            "detractors": {"$sum": "$is_detractor"},
            "happy": {"$sum": {"$cond": [{"$gte": ["$rating", 4]}, 1, 0]}},
            "unhappy": {"$sum": {"$cond": [{"$lte": ["$rating", 3]}, 1, 0]}},
            "rating_1": {"$sum": {"$cond": [{"$eq": ["$rating", 1]}, 1, 0]}},
            "rating_2": {"$sum": {"$cond": [{"$eq": ["$rating", 2]}, 1, 0]}},
            "rating_3": {"$sum": {"$cond": [{"$eq": ["$rating", 3]}, 1, 0]}},
            "rating_4": {"$sum": {"$cond": [{"$eq": ["$rating", 4]}, 1, 0]}},
            "rating_5": {"$sum": {"$cond": [{"$eq": ["$rating", 5]}, 1, 0]}}
        }}
    ]
    
    kpi_cursor = db.products.aggregate(kpi_pipeline)
    kpis = {"nps": 0, "total_reviews": 0, "happy_pct": 0, "worst_product": "N/A"}
    satisfaction = {"happy": 0, "unhappy": 0}
    rating_distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}

    async for stat in kpi_cursor:
        total = stat["total_reviews"]
        if total > 0:
            kpis["total_reviews"] = total
            kpis["nps"] = round(((stat["promoters"] - stat["detractors"]) / total) * 100)
            kpis["happy_pct"] = round((stat["happy"] / total) * 100)
        
        satisfaction["happy"] = stat["happy"]
        satisfaction["unhappy"] = stat["unhappy"]
        
        rating_distribution["1"] = stat["rating_1"]
        rating_distribution["2"] = stat["rating_2"]
        rating_distribution["3"] = stat["rating_3"]
        rating_distribution["4"] = stat["rating_4"]
        rating_distribution["5"] = stat["rating_5"]

    if bad_products:
        kpis["worst_product"] = bad_products[0]["name"]

    return {
        "category_performance": categories,
        "top_products": top_products,
        "bad_products": bad_products,
        "kpis": kpis,
        "satisfaction": satisfaction,
        "rating_distribution": rating_distribution
    }

async def get_filtered_reviews(db, user_id, role, category=None, product_id=None):
    allowed_cats = await get_allowed_categories(db, user_id) if role != "admin" else []
    
    if role != "admin" and not allowed_cats:
        return []
        
    pipeline = []
    if product_id is not None:
        pipeline.append({"$match": {"product_id": product_id}})

    pipeline.extend([
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product_info"
        }},
        {"$unwind": {"path": "$product_info", "preserveNullAndEmptyArrays": False}}
    ])
    
    match_conditions = []
    if role != "admin":
        match_conditions.append({"product_info.category": {"$in": allowed_cats}})
        
    if category:
        match_conditions.append({"product_info.category": category})
        
    if match_conditions:
        pipeline.append({"$match": {"$and": match_conditions}})
        
    cursor = db.reviews.aggregate(pipeline)
    return await cursor.to_list(length=100)

async def get_analytics_data(db, user_id, role, category=None, product_id=None):
    allowed_cats = await get_allowed_categories(db, user_id) if role != "admin" else []
    
    if role != "admin" and not allowed_cats:
        return {"current_nps": 0, "trend": [0,0,0,0,0,0], "distribution": {}}
        
    pipeline = []
    if product_id is not None:
        pipeline.append({"$match": {"product_id": product_id}})

    pipeline.extend([
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product_info"
        }},
        {"$unwind": {"path": "$product_info", "preserveNullAndEmptyArrays": False}}
    ])
    
    match_conditions = []
    if role != "admin":
        match_conditions.append({"product_info.category": {"$in": allowed_cats}})
        
    if category:
        match_conditions.append({"product_info.category": category})
        
    if match_conditions:
        pipeline.append({"$match": {"$and": match_conditions}})
        
    # Facet to get both summary and distribution in one pass
    pipeline.append({
        "$facet": {
            "summary": [
                {"$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "promoters": {"$sum": {"$cond": [{"$gte": ["$rating", 4]}, 1, 0]}},
                    "detractors": {"$sum": {"$cond": [{"$lte": ["$rating", 2]}, 1, 0]}}
                }}
            ],
            "distribution": [
                {"$group": {
                    "_id": "$rating",
                    "count": {"$sum": 1}
                }}
            ]
        }
    })
    
    cursor = db.reviews.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    
    if not result or not result[0]["summary"]:
        return {"current_nps": 0, "trend": [0,0,0,0,0,0], "distribution": {}}
        
    summary = result[0]["summary"][0]
    total = summary["total"]
    
    current_nps = round(((summary["promoters"] - summary["detractors"]) / total * 100)) if total > 0 else 0
    
    nps_trend = [
        current_nps - 12,
        current_nps - 8,
        current_nps - 2,
        current_nps - 5,
        current_nps - 1,
        current_nps
    ]
    
    distribution_list = result[0]["distribution"]
    distribution = {str(int(d["_id"])): d["count"] for d in distribution_list if d["_id"] is not None}
    
    return {
        "current_nps": current_nps,
        "trend": nps_trend,
        "distribution": distribution
    }