import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return response.choices[0].message.content