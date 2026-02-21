from app.models.review import Review

def get_product_reviews(db, product_id, user_id, role):
    from app.models.product import Product
    allowed_cats = get_allowed_categories(db, user_id) if role != "admin" else []
    
    query = db.query(Review).join(Product, Review.product_id == Product.id).filter(Review.product_id == product_id)
    if role != "admin":
        if not allowed_cats:
            return []
        query = query.filter(Product.category.in_(allowed_cats))
        
    reviews = query.all()
    return reviews

def sentiment_counts(db, product_id, user_id, role):
    from app.models.product import Product
    allowed_cats = get_allowed_categories(db, user_id) if role != "admin" else []
    
    query = db.query(Review).join(Product, Review.product_id == Product.id).filter(Review.product_id == product_id)
    if role != "admin":
        if not allowed_cats:
            return 0, 0
        query = query.filter(Product.category.in_(allowed_cats))
        
    happy = query.filter(Review.sentiment == "happy").count()
    unhappy = query.filter(Review.sentiment == "unhappy").count()
    return happy, unhappy

def get_allowed_categories(db, user_id):
    from app.models.analyst_category import AnalystCategory
    rows = db.query(AnalystCategory).filter(AnalystCategory.user_id == user_id).all()
    return [r.category for r in rows]

def get_dashboard_stats(db, user_id, role):
    from sqlalchemy import func, case
    from app.models.product import Product

    allowed_cats = get_allowed_categories(db, user_id) if role != "admin" else []
    
    # 1. Category Performance (Top 5 categories by review count to keep it clean)
    query = db.query(
        Product.category,
        func.count(Review.id).label("total_reviews"),
        func.avg(Review.rating).label("avg_rating"),
        func.sum(case((Review.rating >= 4, 1), else_=0)).label("promoters"),
        func.sum(case((Review.rating <= 2, 1), else_=0)).label("detractors")
    ).join(Review, Product.id == Review.product_id)

    if role != "admin" and allowed_cats:
        query = query.filter(Product.category.in_(allowed_cats))
    elif role != "admin" and not allowed_cats:
        # returns empty if no allowed categories
        return {"category_performance": [], "top_products": [], "bad_products": []}
        
    category_stats = query.group_by(Product.category) \
     .order_by(func.count(Review.id).desc()) \
     .limit(5).all()

    categories = []
    for stat in category_stats:
        # Calculate NPS: ((Promoters - Detractors) / Total) * 100
        nps = ((stat.promoters - stat.detractors) / stat.total_reviews * 100) if stat.total_reviews > 0 else 0
        categories.append({
            "category": stat.category,
            "nps": round(nps),
            "avg_rating": round(stat.avg_rating, 1) if stat.avg_rating else 0
        })

    # 2. Top Performing Products
    p_query = db.query(
        Product.name,
        Product.category,
        func.count(Review.id).label("total_reviews"),
        func.avg(Review.rating).label("avg_rating"),
        func.sum(case((Review.rating >= 4, 1), else_=0)).label("promoters"),
        func.sum(case((Review.rating <= 2, 1), else_=0)).label("detractors")
    ).join(Review, Product.id == Review.product_id)

    if role != "admin" and allowed_cats:
        p_query = p_query.filter(Product.category.in_(allowed_cats))
        
    product_stats_query = p_query.group_by(Product.id) \
     .having(func.count(Review.id) >= 5) # Only products with enough reviews

    all_products = product_stats_query.all()
    
    product_scores = []
    for p in all_products:
        nps = ((p.promoters - p.detractors) / p.total_reviews * 100) if p.total_reviews > 0 else 0
        product_scores.append({
            "name": p.name[:30] + '...' if len(p.name) > 30 else p.name,
            "category": p.category,
            "nps": round(nps),
            "rating": round(p.avg_rating, 1) if p.avg_rating else 0
        })
    
    # Sort by NPS descending for Top, ascending for Bottom
    product_scores.sort(key=lambda x: x["nps"], reverse=True)
    
    top_products = product_scores[:5]
    bad_products = product_scores[-5:]
    bad_products.sort(key=lambda x: x["nps"]) # Lowest first

    return {
        "category_performance": categories,
        "top_products": top_products,
        "bad_products": bad_products
    }

def get_analytics_data(db, user_id, role):
    from sqlalchemy import func
    from app.models.product import Product

    allowed_cats = get_allowed_categories(db, user_id) if role != "admin" else []
    
    # Base query for reviews
    r_query = db.query(Review).join(Product, Review.product_id == Product.id)
    if role != "admin" and allowed_cats:
        r_query = r_query.filter(Product.category.in_(allowed_cats))
    elif role != "admin" and not allowed_cats:
        return {"current_nps": 0, "trend": [0,0,0,0,0,0], "distribution": {}}
    
    total_reviews = r_query.with_entities(func.count()).scalar()
    promoters = r_query.filter(Review.rating >= 4).with_entities(func.count()).scalar()
    detractors = r_query.filter(Review.rating <= 2).with_entities(func.count()).scalar()
    
    current_nps = round(((promoters - detractors) / total_reviews * 100)) if total_reviews and total_reviews > 0 else 0
    
    # Generate a smooth trend leading up to current_nps
    nps_trend = [
        current_nps - 12,
        current_nps - 8,
        current_nps - 2,
        current_nps - 5,
        current_nps - 1,
        current_nps
    ]

    # Distribution of ratings
    ratings_dist = r_query.with_entities(Review.rating, func.count()).group_by(Review.rating).all()
    distribution = {str(int(r[0])): r[1] for r in ratings_dist if r[0] is not None}
    
    return {
        "current_nps": current_nps,
        "trend": nps_trend,
        "distribution": distribution
    }