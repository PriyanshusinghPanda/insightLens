from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, analytics, chat, reports

app = FastAPI(title="InsightLens AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(analytics.router, prefix="/analytics")
app.include_router(chat.router, prefix="/chat")
app.include_router(reports.router, prefix="/reports")


@app.get("/")
def read_root():
    return {"status": "InsightLens API is running"}