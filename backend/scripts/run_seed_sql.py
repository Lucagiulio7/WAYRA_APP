"""
run_seed_sql.py
===============
Esegue supabase/seed.sql direttamente su Supabase PostgreSQL cloud.

Utilizzo:
    cd backend
    venv\\Scripts\\activate
    python scripts/run_seed_sql.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import psycopg2

DB_URL = os.getenv("SUPABASE_DB_URL")
if not DB_URL:
    print("❌  Variabile SUPABASE_DB_URL non trovata in backend/.env")
    sys.exit(1)

SQL_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "supabase", "seed.sql"
)

if not os.path.exists(SQL_FILE):
    print(f"❌  File non trovato: {SQL_FILE}")
    sys.exit(1)

print(f"📄  Lettura {SQL_FILE}...")
with open(SQL_FILE, encoding="utf-8") as f:
    sql = f.read()

print("🔌  Connessione a Supabase PostgreSQL...")
conn = psycopg2.connect(DB_URL)
conn.autocommit = False
cur = conn.cursor()
print("✅  Connesso.\n")

print("🚀  Esecuzione seed.sql...")
try:
    cur.execute(sql)
    conn.commit()
    print("✅  seed.sql eseguito con successo!")
except Exception as e:
    conn.rollback()
    print(f"❌  Errore: {e}")
    sys.exit(1)
finally:
    cur.close()
    conn.close()
