# Collaborazione Git

## Flusso consigliato

1. Lavora sempre su un branch dedicato:

```bash
git checkout -b feature/nome-modifica
```

2. Fai commit piccoli e descrittivi:

```bash
git add .
git commit -m "Descrivi la modifica"
```

3. Pubblica il branch e apri una Pull Request:

```bash
git push -u origin feature/nome-modifica
```

4. Prima di unire su `main`, verifica:

```bash
cd mobile
npm run check
```

## Regole pratiche

- `main` deve restare la versione stabile.
- Non committare `.env`, chiavi, certificati o build locali.
- Usa branch `feature/...` per nuove funzioni e `fix/...` per correzioni.
- Descrivi nella Pull Request cosa cambia e come e stato verificato.
