"""
Verifica rapida: stampa quanti musei ci sono in ogni giorno
dell'itinerario generato per Roma a 3 giorni livello 1.

Esegui dalla cartella backend:
    python scripts/check_museums.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import SessionLocal
from database.models import Attraction
from services.itinerary_builder import build_itinerary

db = SessionLocal()

# ── Verifica colonna nel DB ───────────────────────────────────────────────────
print("=" * 60)
print("1. STATO COLONNA attraction_type nel DB (prime 10 attrazioni Roma)")
print("=" * 60)
attractions_db = (
    db.query(Attraction)
    .filter(Attraction.city == "roma", Attraction.is_food_spot == False)
    .order_by(Attraction.id)
    .limit(10)
    .all()
)
for a in attractions_db:
    print(f"  [{a.block_id}] {a.name[:40]:<40}  type={a.attraction_type}")

nulls = (
    db.query(Attraction)
    .filter(Attraction.city == "roma", Attraction.is_food_spot == False,
            Attraction.attraction_type == None)
    .count()
)
total = (
    db.query(Attraction)
    .filter(Attraction.city == "roma", Attraction.is_food_spot == False)
    .count()
)
print(f"\n  ⚠  attraction_type=NULL: {nulls}/{total} attrazioni")
if nulls > 0:
    print("  → Il seed non è stato rieseguito! Riavvia il backend.")
else:
    print("  ✅ Tutti i record hanno attraction_type.")

# ── Genera itinerario e conta musei ──────────────────────────────────────────
print()
print("=" * 60)
print("2. ITINERARIO 3 GIORNI ROMA LIVELLO 1 — musei per giorno")
print("=" * 60)

all_attractions = [
    a.to_dict() for a in
    db.query(Attraction).filter(Attraction.city == "roma", Attraction.is_food_spot == False).all()
]
food_spots = [
    a.to_dict() for a in
    db.query(Attraction).filter(Attraction.city == "roma", Attraction.is_food_spot == True).all()
]

days = build_itinerary(all_attractions, food_spots, num_days=3, level=1)

for day in days:
    attractions_in_day = [s for s in day["stops"] if s.get("type") == "attraction" and s.get("id", -1) != -1]
    museums = [s for s in attractions_in_day if s.get("attraction_type") == "museo"]
    print(f"\n  Giorno {day['day']}  ({len(attractions_in_day)} attrazioni, {len(museums)} museo/i)")
    for s in attractions_in_day:
        tag = "🏛️ MUSEO" if s.get("attraction_type") == "museo" else f"   {s.get('attraction_type','?')}"
        print(f"    {tag}  {s['name'][:50]}")

db.close()
