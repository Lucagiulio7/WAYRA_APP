#!/usr/bin/env node
/**
 * inject-fonts.js
 * Inietta dichiarazioni @font-face in dist/index.html dopo la build web.
 *
 * Problema: expo-font carica i font via FontFace API (JS) dopo che React gira.
 * Se l'URL generata da Metro è sbagliata in produzione, il font fallisce
 * silenziosamente e le icone mostrano □ vuoti.
 *
 * Soluzione: dichiarare @font-face nell'<head> HTML prima che JS carichi,
 * usando il percorso esatto dei .ttf bundlati da Expo.
 */

const fs   = require("fs");
const path = require("path");

const DIST      = path.join(__dirname, "../dist");
const INDEX_HTML = path.join(DIST, "index.html");

// ── Trova tutti i .ttf nella cartella assets ──────────────────────────────────

function findTtfFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findTtfFiles(full));
    else if (entry.name.endsWith(".ttf")) results.push(full);
  }
  return results;
}

// ── Estrai font-family dal nome file ──────────────────────────────────────────
// "Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf" → "Ionicons"
// "BebasNeue_400Regular.b2b293....ttf"             → "BebasNeue_400Regular"

function extractFontFamily(filePath) {
  const base  = path.basename(filePath, ".ttf");   // es. "Ionicons.b4eb09..."
  const parts = base.split(".");
  // L'hash è sempre l'ultimo segmento — tutto prima è il nome del font
  return parts.length >= 2 ? parts.slice(0, -1).join(".") : base;
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!fs.existsSync(INDEX_HTML)) {
  console.error("❌  dist/index.html non trovato. Esegui prima `npm run export:web`.");
  process.exit(1);
}

const ttfFiles = findTtfFiles(path.join(DIST, "assets"));

if (ttfFiles.length === 0) {
  console.warn("⚠️  Nessun file .ttf trovato in dist/assets/ — skip.");
  process.exit(0);
}

// Genera una riga @font-face per ogni font
const declarations = ttfFiles
  .map((filePath) => {
    const webPath    = "/" + path.relative(DIST, filePath).replace(/\\/g, "/");
    const fontFamily = extractFontFamily(filePath);
    return `    @font-face{font-family:'${fontFamily}';src:url('${webPath}')format('truetype');font-weight:normal;font-style:normal;}`;
  })
  .join("\n");

const styleBlock = `  <style id="expo-fonts">\n${declarations}\n  </style>`;

let html = fs.readFileSync(INDEX_HTML, "utf8");

// Evita doppia iniezione
if (html.includes('id="expo-fonts"')) {
  console.log("ℹ️  Font già iniettati — skip.");
  process.exit(0);
}

html = html.replace("</head>", `${styleBlock}\n</head>`);
fs.writeFileSync(INDEX_HTML, html, "utf8");

console.log(`✅  Iniettati ${ttfFiles.length} @font-face in dist/index.html`);
ttfFiles.forEach((f) => {
  console.log(`   • ${extractFontFamily(f)}`);
});
