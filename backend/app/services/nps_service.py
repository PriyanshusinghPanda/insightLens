def calculate_nps(reviews):
    promoters = sum(1 for r in reviews if r.rating >= 4)
    detractors = sum(1 for r in reviews if r.rating <= 2)
    total = len(reviews)

    if total == 0:
        return 0

    return ((promoters/total)*100) - ((detractors/total)*100)