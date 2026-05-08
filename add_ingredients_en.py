# -*- coding: utf-8 -*-
"""
Aggiunge ingredients_en a tutti i file città.
Per napoli e marrakech (senza ingredients) aggiunge anche ingredients.
"""
import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

DB_DIR = r"backend\database\cities"

# city_file -> dish_name -> (ingredients_it, ingredients_en)
# Per città che hanno già ingredients_it, lasciare ingredients_it=None
INGREDIENTS = {
    "amsterdam": {
        "Stamppot": (
            None,
            ['potatoes', 'kale', 'rookworst smoked sausage', 'butter', 'milk']
        ),
    },
    "antalya": {
        "Piyaz di Antalya": (
            None,
            ['white beans', 'tahini', 'garlic', 'lemon', 'parsley']
        ),
    },
    "atene": {
        "Moussaka": (
            None,
            ['aubergine', 'minced meat', 'tomato', 'cinnamon', 'béchamel']
        ),
    },
    "barcellona": {
        "Pa amb Tomàquet": (
            None,
            ['country bread', 'ripe tomato', 'garlic', 'extra virgin olive oil', 'salt']
        ),
    },
    "berlino": {
        "Currywurst": (
            None,
            ['pork sausage', 'tomato sauce', 'curry powder', 'paprika', 'chips']
        ),
    },
    "bratislava": {
        "Bryndzové halusky": (
            None,
            ['potatoes', 'flour', 'bryndza sheep cheese', 'bacon']
        ),
    },
    "bruges": {
        "Moules-frites": (
            None,
            ['mussels', 'fries', 'celery', 'onion', 'white wine']
        ),
    },
    "bucarest": {
        "Sarmale": (
            None,
            ['cabbage leaves', 'minced meat', 'rice', 'tomato', 'spices']
        ),
    },
    "budapest": {
        "Gulyas": (
            None,
            ['beef', 'onion', 'paprika', 'tomato', 'bell pepper']
        ),
    },
    "candia": {
        "Dakos": (
            None,
            ['barley rusk', 'ripe tomato', 'feta or mizithra', 'olive oil', 'oregano']
        ),
    },
    "copenaghen": {
        "Smørrebrød": (
            None,
            ['rye bread', 'butter', 'herring or cold cuts', 'fresh herbs', 'vegetables']
        ),
    },
    "cracovia": {
        "Pierogi": (
            None,
            ['flour', 'potatoes', 'cheese', 'meat or sauerkraut', 'onion']
        ),
    },
    "dublino": {
        "Irish Stew": (
            None,
            ['lamb or beef', 'potatoes', 'onions', 'carrots', 'broth']
        ),
    },
    "edimburgo": {
        "Haggis": (
            None,
            ['sheep offal', 'oatmeal', 'onion', 'spices', 'stock']
        ),
    },
    "firenze": {
        "Bistecca alla Fiorentina": (
            None,
            ['Chianina beef', 'salt', 'black pepper', 'extra virgin olive oil']
        ),
    },
    "francoforte": {
        "Frankfurter Würstchen": (
            None,
            ['pork and beef blend', 'spices', 'cold smoking', 'natural casing']
        ),
    },
    "istanbul": {
        "Kebap": (
            None,
            ['lamb or beef', 'spices', 'flatbread', 'grilled vegetables']
        ),
    },
    "lisbona": {
        "Bacalhau a Bras": (
            None,
            ['salt cod', 'thin-cut potatoes', 'eggs', 'black olives', 'parsley']
        ),
    },
    "londra": {
        "Fish and Chips": (
            None,
            ['cod', 'beer batter', 'potatoes', 'mushy peas', 'malt vinegar']
        ),
    },
    "madrid": {
        "Cocido madrileno": (
            None,
            ['chickpeas', 'beef', 'chicken', 'root vegetables', 'chorizo']
        ),
    },
    "marrakech": {
        "Tagine": (
            ['agnello o pollo', 'verdure', 'olive', 'spezie ras el hanout', 'limone preservato'],
            ['lamb or chicken', 'vegetables', 'olives', 'ras el hanout spice blend', 'preserved lemon']
        ),
        "Couscous": (
            ['semola di grano duro', 'verdure', 'carne', 'brodo', 'ceci'],
            ['semolina', 'vegetables', 'meat', 'broth', 'chickpeas']
        ),
        "Pastilla": (
            ['pasta warqa', 'piccione o pollo', 'mandorle', 'cannella', 'zucchero a velo'],
            ['warqa pastry', 'pigeon or chicken', 'almonds', 'cinnamon', 'icing sugar']
        ),
        "Harira": (
            ['pomodoro', 'lenticchie', 'ceci', 'coriandolo', 'limone'],
            ['tomato', 'lentils', 'chickpeas', 'coriander', 'lemon']
        ),
        "Msemen": (
            ['farina', 'semola', 'olio', 'burro', 'sale'],
            ['flour', 'semolina', 'oil', 'butter', 'salt']
        ),
        "Baghrir": (
            ['semola fine', 'lievito', 'sale', 'miele', 'burro fuso'],
            ['fine semolina', 'yeast', 'salt', 'honey', 'melted butter']
        ),
        "Chebakia": (
            ['farina', 'sesamo', 'miele', 'acqua di fiori d\'arancio', 'olio di frittura'],
            ['flour', 'sesame seeds', 'honey', 'orange blossom water', 'frying oil']
        ),
        "Tè alla menta": (
            ['tè verde', 'menta fresca', 'zucchero', 'acqua bollente'],
            ['green tea', 'fresh mint', 'sugar', 'boiling water']
        ),
    },
    "marsiglia": {
        "Bouillabaisse": (
            None,
            ['rockfish', 'potatoes', 'saffron', 'tomato', 'rouille sauce']
        ),
    },
    "milano": {
        "Risotto alla milanese": (
            None,
            ['Carnaroli rice', 'beef marrow', 'saffron', 'Parmigiano Reggiano', 'butter']
        ),
    },
    "monaco_di_baviera": {
        "Weißwurst": (
            None,
            ['veal', 'pork back fat', 'parsley', 'sweet mustard', 'pretzel']
        ),
    },
    "muğla": {
        "Muğla Köftesi": (
            None,
            ['minced beef or lamb', 'onion', 'spices', 'bread']
        ),
    },
    "napoli": {
        "Pizza napoletana": (
            ['farina 00', 'acqua', 'lievito', 'sale', 'pomodoro San Marzano', 'fior di latte', 'basilico'],
            ['00 flour', 'water', 'yeast', 'salt', 'San Marzano tomatoes', 'fior di latte mozzarella', 'basil']
        ),
        "Ragù napoletano": (
            ['manzo', 'maiale', 'pomodoro', 'cipolla', 'vino rosso', 'strutto'],
            ['beef', 'pork', 'tomato', 'onion', 'red wine', 'lard']
        ),
        "Genovese": (
            ['pasta', 'cipolle', 'manzo', 'vino bianco', 'olio'],
            ['pasta', 'onions', 'beef', 'white wine', 'olive oil']
        ),
        "Cuoppo": (
            ['pesce misto', 'pastella', 'olio di frittura', 'sale'],
            ['mixed fried fish', 'batter', 'frying oil', 'salt']
        ),
        "Pizza a portafoglio": (
            ['impasto pizza', 'pomodoro', 'fior di latte', 'olio'],
            ['pizza dough', 'tomato', 'fior di latte mozzarella', 'olive oil']
        ),
        "Tarallo nzogna e pepe": (
            ['farina', 'strutto', 'pepe nero', 'mandorle'],
            ['flour', 'lard', 'black pepper', 'almonds']
        ),
        "Sfogliatella": (
            ['semolino', 'ricotta', 'scorza d\'arancia candita', 'cannella'],
            ['semolina', 'ricotta', 'candied orange peel', 'cinnamon']
        ),
        "Babà": (
            ['farina', 'uova', 'burro', 'sciroppo al rum'],
            ['flour', 'eggs', 'butter', 'rum syrup']
        ),
    },
    "parigi": {
        "Croissant au Beurre": (
            None,
            ['flour', 'butter', 'milk', 'eggs', 'yeast', 'sugar']
        ),
    },
    "porto": {
        "Francesinha": (
            None,
            ['bread', 'meat', 'sausage', 'melted cheese', 'beer tomato sauce', 'optional fried egg']
        ),
    },
    "praga": {
        "Svíčková na smetaně": (
            None,
            ['beef sirloin', 'celeriac', 'carrots', 'cream sauce', 'bread dumplings']
        ),
    },
    "roma": {
        "Cacio e Pepe":                    (None, ['tonnarelli pasta', 'Pecorino Romano', 'black pepper']),
        "Carbonara":                       (None, ['rigatoni', 'guanciale', 'egg yolks', 'Pecorino Romano', 'black pepper']),
        "Supplì al Telefono":              (None, ['rice', 'meat ragù', 'mozzarella', 'egg', 'breadcrumbs']),
        "Amatriciana":                     (None, ['bucatini', 'guanciale', 'San Marzano tomato', 'Pecorino Romano', 'white wine']),
        "Coda alla Vaccinara":             (None, ['oxtail', 'celery', 'tomato', 'dark chocolate', 'pine nuts', 'raisins']),
        "Carciofo alla Romana e alla Giudia": (None, ['Roman artichokes', 'mint', 'garlic', 'extra virgin olive oil', 'lemon']),
        "Maritozzo con la Panna":          (None, ['honey brioche bun', 'fresh whipped cream']),
        "Gricia":                          (None, ['rigatoni', 'guanciale', 'Pecorino Romano', 'black pepper']),
    },
    "siviglia": {
        "Espinacas con garbanzos": (
            None,
            ['spinach', 'chickpeas', 'garlic', 'cumin', 'olive oil']
        ),
    },
    "stoccolma": {
        "Köttbullar": (
            None,
            ['minced beef and pork', 'breadcrumbs', 'onion', 'eggs', 'cream gravy', 'lingonberries']
        ),
    },
    "valencia": {
        "Paella Valenciana": (
            None,
            ['short-grain rice', 'chicken', 'rabbit', 'flat green beans', 'garrofó beans', 'saffron']
        ),
    },
    "varsavia": {
        "Pierogi": (
            None,
            ['flour', 'eggs', 'potatoes', 'quark cheese', 'meat or sauerkraut']
        ),
    },
    "venezia": {
        "Sarde in saor": (
            None,
            ['sardines', 'onion', 'white wine vinegar', 'raisins', 'pine nuts']
        ),
    },
    "vienna": {
        "Wiener Schnitzel": (
            None,
            ['veal cutlet', 'egg', 'breadcrumbs', 'clarified butter', 'lemon']
        ),
    },
}

# Città che hanno già ingredients nel file (solo aggiunta ingredients_en)
# Città senza ingredients nel file (aggiunta di entrambi)
NO_INGREDIENTS = {"napoli", "marrakech"}

changed = []

for fname in sorted(os.listdir(DB_DIR)):
    if not fname.endswith(".py") or fname == "__init__.py":
        continue

    city_key = fname.replace(".py", "")
    if city_key not in INGREDIENTS:
        continue

    path = os.path.join(DB_DIR, fname)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    orig = content

    for dish_name, (ing_it, ing_en) in INGREDIENTS[city_key].items():
        ing_en_str = repr(ing_en)

        if city_key in NO_INGREDIENTS:
            # Aggiungi ingredients + ingredients_en prima di 'type'
            ing_it_str = repr(ing_it)
            old = f"'name': '{dish_name}'"
            # cerca il blocco dict di questo piatto e aggiunge prima di 'type'
            def add_both(m):
                block = m.group(0)
                if "'ingredients'" not in block:
                    block = block.replace("'type':", f"'ingredients': {ing_it_str}, 'ingredients_en': {ing_en_str}, 'type':")
                return block
            content = re.sub(
                r"\{[^{}]*'name':\s*'" + re.escape(dish_name) + r"'[^{}]*\}",
                add_both,
                content,
                flags=re.DOTALL
            )
        else:
            # Aggiunge solo ingredients_en alla fine del dict (prima di })
            def add_en(m):
                block = m.group(0)
                if "'ingredients_en'" not in block:
                    # inserisce prima della chiusura }
                    block = re.sub(r"\]\s*\}", f"], 'ingredients_en': {ing_en_str}}}", block)
                return block
            content = re.sub(
                r"\{[^{}]*'name':\s*'" + re.escape(dish_name) + r"'[^{}]*\}",
                add_en,
                content,
                flags=re.DOTALL
            )

    if content != orig:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        changed.append(city_key)

print("Aggiornate:", changed)
print("Totale:", len(changed))
