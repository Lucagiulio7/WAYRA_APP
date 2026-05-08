import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db import engine
from database.models import Base
from database.seed_data import seed, migrate_db
from routers.itinerary import router as itinerary_router
from routers.attractions import router as attractions_router

# ── Bootstrap ─────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
migrate_db()
seed()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ViaggioAI API",
    description="Backend per la generazione di itinerari di viaggio intelligenti",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itinerary_router)
app.include_router(attractions_router)


@app.get("/")
def root():
    return {
        "app": "ViaggioAI",
        "docs": "/docs",
        "health": "/api/health",
    }
