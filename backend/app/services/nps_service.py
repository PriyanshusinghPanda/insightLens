def calculate_nps(reviews):
    """
    Calculate NPS from a list of review dicts.
    NPS = (% promoters) - (% detractors)
    Promoters: rating >= 4, Detractors: rating <= 2
    """
    promoters = sum(1 for r in reviews if r.get("rating", 0) >= 4)
    detractors = sum(1 for r in reviews if r.get("rating", 0) <= 2)
    total = len(reviews)

    if total == 0:
        return 0

    return round(((promoters / total) * 100) - ((detractors / total) * 100))