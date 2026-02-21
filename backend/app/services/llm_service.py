import os
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_reviews(question, reviews):

    text = "\n".join([r.review_text for r in reviews[:25]])

    prompt = f"""
You are an ecommerce product analyst.

Question: {question}

Customer reviews:
{text}

Explain main reasons for ratings.
Give bullet insights.
"""

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )

    return response.text