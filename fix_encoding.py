# -*- coding: utf-8 -*-
import os, re

DB_DIR = r"backend\database\cities"

REPLACEMENTS = [
    ("â\x80\x94",  "—"),  # em-dash (latin-1 artifact)
    ("â\x80\x99",  "'"),       # right single quote latin-1 artifact
    ("â\x80\x98",  "'"),       # left single quote latin-1 artifact
    ("â\x80\x9c",  """),  # left double quote latin-1 artifact
    ("Ã©", "é"), ("Ã¨", "è"), ("Ã\xa0", "à"), ("Ã²", "ò"),
    ("Ã¹", "ù"), ("Ã¬", "ì"), ("Ã­", "í"), ("Ã³", "ó"),
    ("Ãº", "ú"), ("Ã¯", "ï"), ("Ã±", "ñ"), ("Ã§", "ç"),
    ("Ã\x89", "É"), ("Ã\x8e", "Î"), ("Ãª", "ê"), ("Ã¢", "â"),
    ("Ã\x88", "È"), ("Ã\x87", "Ç"), ("Ã¦", "æ"), ("Ã¥", "å"),
    ("Ã¼", "ü"), ("Ã¤", "ä"), ("Ã¶", "ö"),
    ("'???'", "'€€€'"), ("'??'", "'€€'"),
]

APOS_SAFE = [
    (r"\bl ([aeiouàèéìòùAEIOU])", r"l'\1"),
    (r"\bdell ([aeiouàèéìòùAEIOU])", r"dell'\1"),
    (r"\bnell ([aeiouàèéìòùAEIOU])", r"nell'\1"),
    (r"\bsull ([aeiouàèéìòùAEIOU])", r"sull'\1"),
    (r"\ball ([aeiouàèéìòùAEIOU])", r"all'\1"),
]

changed = []
for fname in sorted(os.listdir(DB_DIR)):
    if not fname.endswith(".py") or fname == "__init__.py":
        continue
    path = os.path.join(DB_DIR, fname)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    orig = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    for pat, rep in APOS_SAFE:
        content = re.sub(pat, rep, content)
    if content != orig:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        changed.append(fname)

print("Fixed:", changed)
print("Total:", len(changed))
