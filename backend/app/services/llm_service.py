"""
llm_service.py — Gemini Function Calling Engine for InsightLens

Architecture:
  User query
    → Gemini with 6 declared tool schemas
    → Gemini returns a FunctionCall (tool name + args)
    → Tool dispatcher runs the matching DB function
    → Gemini receives tool result, generates final formatted answer
    → Returns { answer, tool_used, tool_args, chart_data }
"""

import os
import asyncio
from google import genai
from google.genai import types

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ─── Tool Schema Declarations ─────────────────────────────────────────────────
# These are passed to Gemini so it can decide which function to call.

TOOLS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="get_nps",
            description="Get the current NPS (Net Promoter Score) for a product category. Use when the user asks about NPS, promoters, detractors, or customer loyalty for a category.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "category": types.Schema(
                        type="STRING",
                        description="The product category name, e.g. 'Electronics', 'Home & Kitchen'"
                    )
                },
                required=["category"]
            )
        ),
        types.FunctionDeclaration(
            name="get_best_worst_products",
            description="Get the top-rated and worst-rated products in a category. Use when the user asks which products are best or worst, highest or lowest rated, or wants a ranking.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "category": types.Schema(
                        type="STRING",
                        description="The product category name"
                    )
                },
                required=["category"]
            )
        ),
        types.FunctionDeclaration(
            name="get_product_sentiment",
            description="Get happy/unhappy sentiment counts for a specific product. Use when the user asks about sentiment, customer satisfaction, or happiness for a product by its ID.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "product_id": types.Schema(
                        type="INTEGER",
                        description="The numeric product ID"
                    )
                },
                required=["product_id"]
            )
        ),
        types.FunctionDeclaration(
            name="get_trend",
            description="Get the monthly NPS trend and review volume over the last 6-12 months for a category. Use when the user asks about trends, over time, how NPS changed, or review patterns.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "category": types.Schema(
                        type="STRING",
                        description="The product category name"
                    )
                },
                required=["category"]
            )
        ),
        types.FunctionDeclaration(
            name="compare_products",
            description="Compare 2-5 products side by side: avg rating, NPS, review count. Use when the user asks to compare, contrast, or evaluate products against each other.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "product_ids": types.Schema(
                        type="ARRAY",
                        items=types.Schema(type="INTEGER"),
                        description="List of product IDs to compare (2 to 5 IDs)"
                    )
                },
                required=["product_ids"]
            )
        ),
        types.FunctionDeclaration(
            name="summarize_product_reviews",
            description="Summarize customer reviews for a specific product, answering a specific question. Use when the user asks to summarize, analyze, explain, or get insights on reviews for a product.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "product_id": types.Schema(
                        type="INTEGER",
                        description="The numeric product ID"
                    ),
                    "question": types.Schema(
                        type="STRING",
                        description="The specific analysis question to answer about the product"
                    )
                },
                required=["product_id", "question"]
            )
        )
    ])
]


SYSTEM_PROMPT = """You are InsightLens, an expert e-commerce product analytics AI.
You answer questions about Amazon product reviews by calling real analysis functions.

Rules:
- ALWAYS call one of the provided tools to fetch real data. Never guess or make up numbers.
- After getting tool results, format your answer clearly with markdown.
- For NPS scores, explain what the score means (>50 is excellent, 30-50 is good, 0-30 is needs improvement, <0 is poor).
- For product comparisons, summarize key differences.
- For trends, highlight the direction and any notable changes.
- Keep your response concise but insightful — max 300 words unless summarizing reviews.
"""


# ─── Tool Dispatcher ──────────────────────────────────────────────────────────

async def _dispatch_tool(tool_name: str, tool_args: dict, db, user_id, role) -> tuple[dict, dict | None]:
    """
    Runs the actual DB function for the given tool name.
    Returns (result_dict, chart_data_or_None).
    """
    from app.services.analytics_service import (
        get_nps_for_category, get_dashboard_stats,
        sentiment_counts, get_trend_over_time,
        compare_products, get_product_reviews, get_allowed_categories
    )

    if tool_name == "get_nps":
        result = await get_nps_for_category(db, tool_args["category"], user_id, role)
        return result, None

    elif tool_name == "get_best_worst_products":
        # Use dashboard stats filtered to category, extract top/bad products
        category = tool_args["category"]
        allowed_cats = await get_allowed_categories(db, user_id) if role != "admin" else []
        if role != "admin" and category not in allowed_cats:
            return {"error": "Access denied"}, None

        pipeline = [
            {"$match": {"category": category}},
            {"$lookup": {
                "from": "reviews",
                "localField": "id",
                "foreignField": "product_id",
                "as": "reviews"
            }},
            {"$project": {
                "id": 1, "name": 1, "category": 1,
                "review_count": {"$size": "$reviews"},
                "avg_rating": {"$avg": "$reviews.rating"},
                "promoters": {"$size": {"$filter": {
                    "input": "$reviews", "as": "r",
                    "cond": {"$gte": ["$$r.rating", 4]}
                }}},
                "detractors": {"$size": {"$filter": {
                    "input": "$reviews", "as": "r",
                    "cond": {"$lte": ["$$r.rating", 2]}
                }}}
            }},
            {"$match": {"review_count": {"$gte": 3}}},
        ]
        cursor = db.products.aggregate(pipeline)
        raw = await cursor.to_list(length=50)

        scored = []
        for p in raw:
            total = p["review_count"]
            nps = round(((p["promoters"] - p["detractors"]) / total) * 100) if total > 0 else 0
            name = p["name"]
            scored.append({
                "name": name[:30] + "…" if len(name) > 30 else name,
                "nps": nps,
                "avg_rating": round(p["avg_rating"], 1) if p["avg_rating"] else 0,
                "review_count": total
            })

        scored.sort(key=lambda x: x["nps"], reverse=True)
        top = scored[:5]
        worst = sorted(scored[-5:], key=lambda x: x["nps"])

        chart_data = {
            "type": "bar",
            "title": f"Top & Worst Products — {category}",
            "labels": [p["name"] for p in top + worst],
            "datasets": [{"label": "NPS Score", "data": [p["nps"] for p in top + worst]}]
        }
        return {"category": category, "top_products": top, "worst_products": worst}, chart_data

    elif tool_name == "get_product_sentiment":
        product_id = tool_args["product_id"]
        happy, unhappy = await sentiment_counts(db, product_id, user_id, role)
        total = happy + unhappy
        chart_data = {
            "type": "pie",
            "title": f"Sentiment — Product {product_id}",
            "labels": ["Happy (4-5★)", "Unhappy (1-3★)"],
            "datasets": [{"label": "Sentiment", "data": [happy, unhappy]}]
        }
        return {
            "product_id": product_id,
            "happy": happy,
            "unhappy": unhappy,
            "happy_pct": round((happy / total) * 100) if total > 0 else 0
        }, chart_data

    elif tool_name == "get_trend":
        result = await get_trend_over_time(db, tool_args["category"], user_id, role)
        chart_data = result.pop("chart_data", None)
        return result, chart_data

    elif tool_name == "compare_products":
        from app.services.analytics_service import compare_products as _compare
        result = await _compare(db, tool_args["product_ids"], user_id, role)
        chart_data = result.pop("chart_data", None)
        return result, chart_data

    elif tool_name == "summarize_product_reviews":
        product_id = tool_args["product_id"]
        question = tool_args.get("question", "Summarize these reviews.")
        reviews = await get_product_reviews(db, product_id, user_id, role)
        if not reviews:
            return {"error": "No reviews found or access denied for this product"}, None
        # Sort by helpful votes if available, take top 25
        reviews_sorted = sorted(reviews, key=lambda r: r.get("helpful_votes", 0), reverse=True)
        return {"product_id": product_id, "review_count": len(reviews), "top_25_reviews": reviews_sorted[:25], "question": question}, None

    return {"error": f"Unknown tool: {tool_name}"}, None


# ─── Main Entry Point ─────────────────────────────────────────────────────────

async def run_tool_call(query: str, db, user_id, role, context_product_id: int | None = None):
    """
    Full tool-calling pipeline:
    1. Send query + tools to Gemini
    2. Gemini picks a tool and returns FunctionCall
    3. Dispatcher runs the DB function
    4. Gemini formats the result into a final answer

    Returns:
        {
          "answer": str,
          "tool_used": str,
          "tool_args": dict,
          "chart_data": dict | None
        }
    """
    # If user gives contextual product_id, inject it into the query
    augmented_query = query
    if context_product_id:
        augmented_query = f"{query} (Context: product_id={context_product_id})"

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=TOOLS,
        tool_config=types.ToolConfig(
            function_calling_config=types.FunctionCallingConfig(mode="ANY")
        )
    )

    # Step 1: Ask Gemini which tool to call
    def _call_gemini_step1():
        return client.models.generate_content(
            model='gemini-2.5-flash',
            contents=augmented_query,
            config=config
        )

    try:
        response1 = await asyncio.wait_for(
            asyncio.to_thread(_call_gemini_step1),
            timeout=15.0
        )
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return {
                "answer": "The AI service is temporarily unavailable due to rate limits. Please try again in a few seconds.",
                "tool_used": None,
                "tool_args": None,
                "chart_data": None
            }
        raise

    # Extract function call from response
    tool_name = None
    tool_args = {}
    for part in response1.candidates[0].content.parts:
        if part.function_call:
            tool_name = part.function_call.name
            tool_args = dict(part.function_call.args)
            break

    if not tool_name:
        # Gemini chose to answer directly (shouldn't happen with mode=ANY, but handle gracefully)
        answer_text = response1.text or "I couldn't determine which analysis to run."
        return {"answer": answer_text, "tool_used": "none", "tool_args": {}, "chart_data": None}

    # Step 2: Run the actual DB tool
    tool_result, chart_data = await _dispatch_tool(tool_name, tool_args, db, user_id, role)

    # Step 3: Handle summarize_product_reviews specially (needs LLM pass)
    if tool_name == "summarize_product_reviews" and "error" not in tool_result:
        reviews = tool_result["top_25_reviews"]
        question = tool_result["question"]
        final_answer = await summarize_reviews(question, reviews)
        return {
            "answer": final_answer,
            "tool_used": tool_name,
            "tool_args": tool_args,
            "chart_data": None
        }

    # Step 4: Send tool result back to Gemini for final formatted answer
    import json
    tool_result_text = json.dumps(tool_result, default=str)

    conversation = [
        types.Content(role="user", parts=[types.Part(text=augmented_query)]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name=tool_name, args=tool_args))]
        ),
        types.Content(
            role="user",
            parts=[types.Part(function_response=types.FunctionResponse(
                name=tool_name,
                response={"result": tool_result}
            ))]
        )
    ]

    config2 = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)

    def _call_gemini_step2():
        return client.models.generate_content(
            model='gemini-2.5-flash',
            contents=conversation,
            config=config2
        )

    try:
        response2 = await asyncio.wait_for(
            asyncio.to_thread(_call_gemini_step2),
            timeout=15.0
        )
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return {
                "answer": "I have the data ready, but the AI formatter is hit with a rate limit. Please try again briefly.",
                "tool_used": tool_name,
                "tool_args": tool_args,
                "chart_data": chart_data
            }
        raise

    final_answer = response2.text or "I retrieved the data but couldn't format an answer."

    return {
        "answer": final_answer,
        "tool_used": tool_name,
        "tool_args": tool_args,
        "chart_data": chart_data
    }


# ─── Legacy: direct summarization (still used by /analytics/insights) ─────────

async def summarize_reviews(question: str, reviews: list) -> str:
    """Direct LLM summarization of reviews (no tool-calling). Used by analytics/insights."""
    # Sort by helpful_votes if available, cap at 25 to control token cost
    reviews_sorted = sorted(reviews, key=lambda r: r.get("helpful_votes", 0), reverse=True)
    text = "\n".join([r.get("review_text", r.get("text", "")) for r in reviews_sorted[:25] if r.get("review_text") or r.get("text")])

    if not text.strip():
        return "No review text available for analysis."

    prompt = f"""You are an expert ecommerce product analyst.
Review the following customer reviews and answer: "{question}"

Customer Reviews:
{text}

Format your response EXACTLY with these markdown headers:
### Summary
(Brief 2-3 sentence overview)
### Key Complaints
(3-5 bullet points)
### Positive Highlights
(3-5 bullet points)
### Recommendations
(2-3 actionable bullet points)
"""

    def generate():
        return client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(generate),
            timeout=20.0
        )
        return response.text
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return "Summarization is temporarily unavailable due to rate limits."
        return f"Error during summarization: {str(e)}"