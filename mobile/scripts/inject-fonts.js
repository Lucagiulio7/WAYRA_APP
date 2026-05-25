#!/usr/bin/env node
/**
 * inject-fonts.js
 * Inietta dichiarazioni @font-face in dist/index.html dopo la build web.
 *
 * Problema: su alcuni ambienti di build (es. Netlify Linux), Metro bundler
 * produce file .ttf in dist/assets/ come mini-stub JS (< 10 KB) invece dei
 * veri font TrueType. Il browser li scarica con HTTP 200 ma la FontFace API
 * li rifiuta perché non sono font validi → icone mostrano □.
 *
 * Soluzione:
 * 1. Per ogni .ttf in dist/assets/, controlla se è un font valido (magic bytes
 *    TrueType: 0x00010000 o "OTTO" per OTF, o "true"/"typ1").
 * 2. Se è uno stub, cerca il font reale in node_modules e copia il file vero
 *    al posto dello stub (stessa path → stessa URL già in cache del browser).
 * 3. Inietta @font-face nell'<head> con font-display:block, sostituendo sempre
 *    il blocco <style id="expo-fonts"> esistente.
 */

const fs   = require("fs");
const path = require("path");

const DIST        = path.join(__dirname, "../dist");
const INDEX_HTML  = path.join(DIST, "index.html");
const NODE_MODULES = path.join(__dirname, "../node_modules");

// Soglia: file < 50 KB sono considerati stub (i font reali sono 100 KB+)
const MIN_FONT_BYTES = 50 * 1024;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/** Estrae il nome base del font dal filename hashato.
 *  "Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf" → "Ionicons"
 *  "BebasNeue_400Regular.b2b293....ttf"             → "BebasNeue_400Regular"
 */
function extractFontFamily(filePath) {
  const base  = path.basename(filePath, ".ttf");
  const parts = base.split(".");
  return parts.length >= 2 ? parts.slice(0, -1).join(".") : base;
}

/** Controlla se il file è un font TrueType valido leggendo i magic bytes. */
function isValidTtf(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < MIN_FONT_BYTES) return false;
    // Magic bytes: TrueType = 00 01 00 00 | "true" | "typ1" | "OTTO" (CFF/OTF)
    const buf = Buffer.alloc(4);
    const fd  = fs.openSync(filePath, "r");
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    const magic = buf.toString("hex");
    return (
      magic === "00010000" ||          // TrueType standard
      buf.toString("ascii") === "OTTO" || // OpenType/CFF
      buf.toString("ascii") === "true" || // TrueType Mac
      buf.toString("ascii") === "typ1"    // Type 1
    );
  } catch {
    return false;
  }
}

/**
 * Cerca il font reale in node_modules partendo dal nome base (senza hash).
 * Restituisce il path trovato o null.
 */
function findRealFontInNodeModules(fontBaseName) {
  const needle = `${fontBaseName}.ttf`;
  function search(dir, depth) {
    if (depth > 8) return null;
    if (!fs.existsSync(dir)) return null;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = search(full, depth + 1);
        if (found) return found;
      } else if (entry.name === needle) {
        return full;
      }
    }
    return null;
  }
  return search(NODE_MODULES, 0);
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

// ── Fase 1: valida e ripara i file stub ────────────────────────────────────

let repairedCount = 0;
for (const filePath of ttfFiles) {
  if (isValidTtf(filePath)) continue; // ok

  const fontBaseName = extractFontFamily(filePath);
  const realFont     = findRealFontInNodeModules(fontBaseName);

  if (!realFont) {
    console.warn(`⚠️  Stub rilevato ma font reale non trovato per: ${fontBaseName}`);
    continue;
  }

  fs.copyFileSync(realFont, filePath);
  const kb = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`🔧  Sostituito stub con font reale: ${fontBaseName} (${kb} KB)`);
  repairedCount++;
}

if (repairedCount > 0) {
  console.log(`✅  Riparati ${repairedCount} font stub con i file reali da node_modules.`);
}

// ── Fase 2: genera e inietta @font-face nell'HTML ─────────────────────────

const declarations = ttfFiles
  .map((filePath) => {
    const webPath    = "/" + path.relative(DIST, filePath).replace(/\\/g, "/");
    const fontFamily = extractFontFamily(filePath);
    return `    @font-face{font-family:'${fontFamily}';src:url('${webPath}') format('truetype');font-weight:normal;font-style:normal;font-display:block;}`;
  })
  .join("\n");

const styleBlock = `  <style id="expo-fonts">\n${declarations}\n  </style>`;

let html = fs.readFileSync(INDEX_HTML, "utf8");

// Rimuovi blocco expo-fonts esistente (Expo o run precedente)
if (html.includes('id="expo-fonts"')) {
  html = html.replace(/<style id="expo-fonts">[\s\S]*?<\/style>/, "");
  console.log("ℹ️  Rimosso blocco expo-fonts esistente (verrà riscritto con path locali).");
}

html = html.replace("</head>", `${styleBlock}\n</head>`);
fs.writeFileSync(INDEX_HTML, html, "utf8");

console.log(`✅  Iniettati ${ttfFiles.length} @font-face (font-display:block) in dist/index.html`);
ttfFiles.forEach((f) => console.log(`   • ${extractFontFamily(f)}`));
