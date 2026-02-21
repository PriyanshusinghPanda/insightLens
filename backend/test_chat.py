import asyncio, os
from dotenv import load_dotenv
load_dotenv()
from app.database import init_db, get_db
from app.routes.chat import ask, ChatRequest

async def test():
    try:
        db = await get_db()
        req = ChatRequest(product_id=1, question="Are people happy?")
        user = {"user_id": 1, "role": "admin"}
        ans = await ask(req, user=user, db=db)
        print("SUCCESS:", ans)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
