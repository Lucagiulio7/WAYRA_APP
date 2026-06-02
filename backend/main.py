import os
from dotenv import load_dotenv

load_dotenv()

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from services.rate_limit import proxy_aware_remote_address

from database.db import engine
from database.models import Base
from database.seed_data import seed, migrate_db
from routers.itinerary import router as itinerary_router
from routers.attractions import router as attractions_router

# ── Sentry ────────────────────────────────────────────────────────────────────
_sentry_dsn = os.getenv("SENTRY_DSN", "")
if _sentry_dsn:
    sentry_sdk.init(
        dsn=_sentry_dsn,
        environment=os.getenv("ENVIRONMENT", "production"),
        traces_sample_rate=0.2,   # 20% delle transazioni tracciate
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
    )

# ── Bootstrap ─────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
migrate_db()
seed()

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=proxy_aware_remote_address, default_limits=["200/hour"])

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ViaggioAI API",
    description="Backend per la generazione di itinerari di viaggio intelligenti",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("CORS_ORIGINS", "")
if _raw_origins.strip() == "*" or not _raw_origins.strip():
    # Sviluppo locale: aperto. In produzione impostare CORS_ORIGINS nel .env
    _allow_origins = ["*"]
else:
    _allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
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
