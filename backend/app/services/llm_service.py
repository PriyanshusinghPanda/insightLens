import os
from google import genai
import asyncio

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def summarize_reviews(question, reviews):

    text = "\n".join([r.get("review_text", "") for r in reviews[:25]])

    prompt = f"""
You are an expert ecommerce product analyst.
Review the following customer reviews for a specific product and answer the question: "{question}"

Customer reviews:
{text}

Please format your response EXACTLY with the following markdown headers:
### Summary
(Brief overview)
### Key Complaints
(Bullet points)
### Positive Highlights
(Bullet points)
### Recommendations
(Actionable bullet points)
"""

    def generate():
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text

    return await asyncio.to_thread(generate)