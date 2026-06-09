"""
seed_supabase.py
================
Script one-shot: carica tutti i dati delle 11 città su Supabase PostgreSQL.
Supporta campi multilingua (name_en, description_en, title_en, body_en).

Utilizzo:
    cd backend
    venv\\Scripts\\activate
    python scripts/seed_supabase.py

Variabile d'ambiente richiesta (in backend/.env):
    SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@...supabase.com:5432/postgres
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import psycopg2
import psycopg2.extras

from database.cities import ALL_CITIES

# ── Connessione ──────────────────────────────────────────────────────────────

DB_URL = os.getenv("SUPABASE_DB_URL")
if not DB_URL:
    print("❌  Variabile SUPABASE_DB_URL non trovata in .env")
    sys.exit(1)

print("🔌  Connessione a Supabase PostgreSQL...")
conn = psycopg2.connect(DB_URL)
cur  = conn.cursor()
print("✅  Connesso.\n")

# ── Pulizia ──────────────────────────────────────────────────────────────────

print("🧹  Pulizia tabelle esistenti...")
cur.execute("TRUNCATE public.culture_facts, public.foods, public.attractions RESTART IDENTITY CASCADE;")
conn.commit()
print("✅  Tabelle svuotate.\n")

def j(val):
    return json.dumps(val, ensure_ascii=False)

# ── Attrazioni turistiche ────────────────────────────────────────────────────

print("🏛️   Inserimento attrazioni...")
attraction_rows = []
for city in ALL_CITIES:
    for a in city.ATTRACTIONS:
        if "name" not in a:   # salta culture facts finite per errore in ATTRACTIONS
            continue
        attraction_rows.append((
            a["name"],
            a.get("name_en"),
            a.get("description"),
            a.get("description_en"),
            a["category_level"],
            a.get("block_id"),
            a.get("zone"),
            a["latitude"],
            a["longitude"],
            a.get("estimated_visit_time", 60),
            j(a.get("tags", [])),
            a["city"],
            False, None, None, None,
            a.get("attraction_type"),
            a.get("ticket_url"),
        ))

psycopg2.extras.execute_values(cur, """
    INSERT INTO public.attractions
        (name, name_en, description, description_en,
         category_level, block_id, zone,
         latitude, longitude, estimated_visit_time, tags,
         city, is_food_spot, food_type, meal_type, rating,
         attraction_type, ticket_url)
    VALUES %s
""", attraction_rows)
conn.commit()
print(f"   ✅  {len(attraction_rows)} attrazioni inserite.")

# ── Food spots (ristoranti) ──────────────────────────────────────────────────

print("🍽️   Inserimento food spot...")
food_spot_rows = []
for city in ALL_CITIES:
    for f in city.FOOD_SPOTS:
        food_spot_rows.append((
            f["name"],
            f.get("name_en"),
            f.get("description"),
            f.get("description_en"),
            f.get("category_level", 1),
            f.get("block_id"),
            f.get("zone"),
            f["latitude"],
            f["longitude"],
            f.get("estimated_visit_time", 30),
            j(f.get("tags", [])),
            f["city"],
            True,
            f.get("food_type"),
            f.get("meal_type"),
            f.get("rating"),
        ))

psycopg2.extras.execute_values(cur, """
    INSERT INTO public.attractions
        (name, name_en, description, description_en,
         category_level, block_id, zone,
         latitude, longitude, estimated_visit_time, tags,
         city, is_food_spot, food_type, meal_type, rating)
    VALUES %s
""", food_spot_rows)
conn.commit()
print(f"   ✅  {len(food_spot_rows)} food spot inseriti.")

# ── Piatti tradizionali ──────────────────────────────────────────────────────

print("🥘  Inserimento piatti tradizionali...")
food_rows = []
for city in ALL_CITIES:
    for f in city.FOODS_BY_CITY:
        food_rows.append((
            f["name"],
            f.get("name_en"),
            f.get("name_fr"),
            f.get("description"),
            f.get("description_en"),
            f.get("description_fr"),
            j(f.get("ingredients", [])),
            j(f.get("ingredients_en", [])),
            j(f.get("ingredients_fr", [])),
            city.CITY_ID,
        ))

psycopg2.extras.execute_values(cur, """
    INSERT INTO public.foods (name, name_en, name_fr, description, description_en, description_fr, ingredients, ingredients_en, ingredients_fr, city)
    VALUES %s
""", food_rows)
conn.commit()
print(f"   ✅  {len(food_rows)} piatti inseriti.")

# ── Culture facts ────────────────────────────────────────────────────────────

print("📚  Inserimento culture facts...")
fact_rows = []
for city in ALL_CITIES:
    for i, fact in enumerate(city.CULTURE_FACTS):
        fact_rows.append((
            city.CITY_ID,
            fact.get("icon", ""),
            fact.get("title", ""),
            fact.get("title_en"),
            fact.get("body", ""),
            fact.get("body_en"),
            i,
        ))

psycopg2.extras.execute_values(cur, """
    INSERT INTO public.culture_facts (city, icon, title, title_en, body, body_en, sort_order)
    VALUES %s
""", fact_rows)
conn.commit()
print(f"   ✅  {len(fact_rows)} culture facts inseriti.")

# ── Riepilogo ────────────────────────────────────────────────────────────────

cur.execute("SELECT COUNT(*) FROM public.attractions WHERE is_food_spot = FALSE;")
n_att = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM public.attractions WHERE is_food_spot = TRUE;")
n_food_spot = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM public.foods;")
n_foods = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM public.culture_facts;")
n_facts = cur.fetchone()[0]
cur.close()
conn.close()

print()
print("=" * 45)
print("🎉  SEED COMPLETATO")
print("=" * 45)
print(f"  Attrazioni:      {n_att}")
print(f"  Food spot:       {n_food_spot}")
print(f"  Piatti tipici:   {n_foods}")
print(f"  Culture facts:   {n_facts}")
print(f"  Città caricate:  {len(ALL_CITIES)}")
print("=" * 45)
