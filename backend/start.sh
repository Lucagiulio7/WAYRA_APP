#!/usr/bin/env bash
# Avvia il backend ViaggioAI
set -e

if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Creato .env — inserisci la tua ANTHROPIC_API_KEY nel file .env"
  exit 1
fi

if [ ! -d venv ]; then
  python -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate

pip install -r requirements.txt -q

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
