"""
Rate-limit utilities — helper proxy-aware per slowapi.

Quando il backend è dietro un reverse proxy (Nginx, Cloudflare, AWS ALB, ecc.)
tutte le richieste arrivano dall'IP del proxy. Senza intercettare
X-Forwarded-For il rate limiter strozza TUTTI gli utenti come uno solo.

Per attivare il proxy-aware mode imposta in .env:
    TRUST_PROXY=true

ATTENZIONE: abilita solo se sei davvero dietro un proxy che fa overwrite di
X-Forwarded-For. Altrimenti un client può spoofare l'header e bypassare i limiti.
"""
import os
from fastapi import Request
from slowapi.util import get_remote_address


def proxy_aware_remote_address(request: Request) -> str:
    trust_proxy = os.getenv("TRUST_PROXY", "false").lower() in ("true", "1", "yes")
    if trust_proxy:
        # X-Forwarded-For può essere "client, proxy1, proxy2" — il primo è il client reale.
        fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if fwd:
            return fwd
        real_ip = request.headers.get("x-real-ip", "").strip()
        if real_ip:
            return real_ip
    return get_remote_address(request)
