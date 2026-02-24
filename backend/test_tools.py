"""
test_tools.py — Direct test of the Phase 3/4 tool dispatcher (no LLM needed).
Tests all 6 tools against the live DB. Run from backend/ directory.

Usage:
    cd backend
    python test_tools.py
"""
import asyncio, os
from dotenv import load_dotenv
load_dotenv()

from app.database import get_db
from app.services.llm_service import _dispatch_tool

# ─── Config ───────────────────────────────────────────────────────────────────
ADMIN_USER_ID = 1
ADMIN_ROLE = "admin"

# Change these to values that exist in your database
TEST_CATEGORY = None   # Will be auto-detected
TEST_PRODUCT_ID_1 = None  # Will be auto-detected
TEST_PRODUCT_ID_2 = None  # Will be auto-detected


async def auto_detect_test_data(db):
    """Pick a real category and product IDs from the DB to avoid hardcoding."""
    global TEST_CATEGORY, TEST_PRODUCT_ID_1, TEST_PRODUCT_ID_2

    # Pick one category
    cat_cursor = db.products.distinct("category")
    categories = await cat_cursor
    if categories:
        TEST_CATEGORY = categories[0]

    # Pick two product IDs
    prod_cursor = db.products.find({}, {"id": 1}).limit(2)
    prods = await prod_cursor.to_list(length=2)
    if len(prods) >= 1:
        TEST_PRODUCT_ID_1 = prods[0]["id"]
    if len(prods) >= 2:
        TEST_PRODUCT_ID_2 = prods[1]["id"]

    print(f"  Auto-detected → Category: {TEST_CATEGORY!r}, Products: {TEST_PRODUCT_ID_1}, {TEST_PRODUCT_ID_2}\n")


async def run_tests():
    db = await get_db()
    await auto_detect_test_data(db)

    if not TEST_CATEGORY:
        print("❌ No categories found in DB. Make sure data is seeded.")
        return

    results = []

    # ── Test 1: get_nps ───────────────────────────────────────────────────────
    print(f"[1/6] Testing get_nps — category={TEST_CATEGORY!r}")
    try:
        r, _ = await _dispatch_tool("get_nps", {"category": TEST_CATEGORY}, db, ADMIN_USER_ID, ADMIN_ROLE)
        assert "nps" in r, f"Missing 'nps' key: {r}"
        assert isinstance(r["nps"], (int, float)), f"NPS not a number: {r}"
        print(f"  ✅ NPS = {r['nps']} (total_reviews={r.get('total_reviews')})")
        results.append(True)
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        results.append(False)

    # ── Test 2: get_best_worst_products ───────────────────────────────────────
    print(f"\n[2/6] Testing get_best_worst_products — category={TEST_CATEGORY!r}")
    try:
        r, chart = await _dispatch_tool("get_best_worst_products", {"category": TEST_CATEGORY}, db, ADMIN_USER_ID, ADMIN_ROLE)
        assert "top_products" in r, f"Missing 'top_products': {r}"
        assert "worst_products" in r, f"Missing 'worst_products': {r}"
        assert chart is not None and chart.get("type") == "bar", f"Bad chart: {chart}"
        print(f"  ✅ Top: {len(r['top_products'])} products, Worst: {len(r['worst_products'])} products")
        results.append(True)
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        results.append(False)

    # ── Test 3: get_product_sentiment ─────────────────────────────────────────
    if TEST_PRODUCT_ID_1:
        print(f"\n[3/6] Testing get_product_sentiment — product_id={TEST_PRODUCT_ID_1}")
        try:
            r, chart = await _dispatch_tool("get_product_sentiment", {"product_id": TEST_PRODUCT_ID_1}, db, ADMIN_USER_ID, ADMIN_ROLE)
            assert "happy" in r and "unhappy" in r, f"Missing sentiment keys: {r}"
            assert chart is not None and chart.get("type") == "pie", f"Bad chart: {chart}"
            print(f"  ✅ Happy={r['happy']}, Unhappy={r['unhappy']}, Happy%={r['happy_pct']}%")
            results.append(True)
        except Exception as e:
            print(f"  ❌ FAILED: {e}")
            results.append(False)
    else:
        print("\n[3/6] ⚠️  Skipped (no product ID found)")
        results.append(None)

    # ── Test 4: get_trend ─────────────────────────────────────────────────────
    print(f"\n[4/6] Testing get_trend — category={TEST_CATEGORY!r}")
    try:
        r, chart = await _dispatch_tool("get_trend", {"category": TEST_CATEGORY}, db, ADMIN_USER_ID, ADMIN_ROLE)
        assert "labels" in r and "nps_trend" in r, f"Missing trend keys: {r}"
        assert len(r["labels"]) >= 2, f"Too few data points: {r['labels']}"
        assert chart is not None and chart.get("type") == "line", f"Bad chart: {chart}"
        print(f"  ✅ {len(r['labels'])} months of data, last NPS={r['nps_trend'][-1]}")
        results.append(True)
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        results.append(False)

    # ── Test 5: compare_products ──────────────────────────────────────────────
    if TEST_PRODUCT_ID_1 and TEST_PRODUCT_ID_2:
        print(f"\n[5/6] Testing compare_products — ids={[TEST_PRODUCT_ID_1, TEST_PRODUCT_ID_2]}")
        try:
            r, chart = await _dispatch_tool("compare_products", {"product_ids": [TEST_PRODUCT_ID_1, TEST_PRODUCT_ID_2]}, db, ADMIN_USER_ID, ADMIN_ROLE)
            assert "products" in r and len(r["products"]) >= 1, f"No products in compare result: {r}"
            assert chart is not None and chart.get("type") == "bar", f"Bad chart: {chart}"
            print(f"  ✅ Compared {len(r['products'])} products")
            for p in r["products"]:
                print(f"     → {p['name']}: rating={p['avg_rating']}, nps={p['nps']}, reviews={p['review_count']}")
            results.append(True)
        except Exception as e:
            print(f"  ❌ FAILED: {e}")
            results.append(False)
    else:
        print("\n[5/6] ⚠️  Skipped (need 2 product IDs)")
        results.append(None)

    # ── Test 6: summarize_product_reviews ─────────────────────────────────────
    if TEST_PRODUCT_ID_1:
        print(f"\n[6/6] Testing summarize_product_reviews — product_id={TEST_PRODUCT_ID_1}")
        try:
            r, chart = await _dispatch_tool(
                "summarize_product_reviews",
                {"product_id": TEST_PRODUCT_ID_1, "question": "What do customers think of this product?"},
                db, ADMIN_USER_ID, ADMIN_ROLE
            )
            # This just fetches reviews, LLM pass happens in run_tool_call
            assert "top_25_reviews" in r or "error" in r, f"Unexpected result: {r}"
            if "error" in r:
                print(f"  ⚠️  No reviews found for product {TEST_PRODUCT_ID_1} (expected if product has 0 reviews)")
            else:
                print(f"  ✅ Fetched {len(r['top_25_reviews'])} reviews for summarization")
            results.append(True)
        except Exception as e:
            print(f"  ❌ FAILED: {e}")
            results.append(False)
    else:
        print("\n[6/6] ⚠️  Skipped (no product ID found)")
        results.append(None)

    # ── Summary ───────────────────────────────────────────────────────────────
    passed = sum(1 for r in results if r is True)
    failed = sum(1 for r in results if r is False)
    skipped = sum(1 for r in results if r is None)
    total = len(results)

    print(f"\n{'='*50}")
    print(f"Results: {passed}/{total} passed, {failed} failed, {skipped} skipped")
    if failed == 0:
        print("🎉 All tool dispatchers working correctly!")
    else:
        print("⚠️  Some tools have issues. Check the output above.")


asyncio.run(run_tests())
