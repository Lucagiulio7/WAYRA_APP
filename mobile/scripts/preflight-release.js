const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = readJson("app.json");
const eas = readJson("eas.json");
const pkg = readJson("package.json");
const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function check(condition, message) {
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function pngSize(relativePath) {
  const file = fs.readFileSync(path.join(root, relativePath));
  check(file.length >= 24 && file.toString("ascii", 1, 4) === "PNG", `${relativePath} is not a valid PNG.`);
  return file.length >= 24
    ? { width: file.readUInt32BE(16), height: file.readUInt32BE(20) }
    : { width: 0, height: 0 };
}

function walkFiles(directory, extensions) {
  const result = [];
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walkFiles(fullPath, extensions));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) result.push(fullPath);
  }
  return result;
}

const expo = app.expo || {};
check(expo.name === "Wayra", "Expo app name must be Wayra.");
check(/^\d+\.\d+\.\d+$/.test(expo.version || ""), "Expo version must use semantic versioning.");
check(/^[a-z][a-z0-9.-]+$/.test(expo.ios?.bundleIdentifier || ""), "Missing or invalid iOS bundle identifier.");
check(/^[a-z][a-z0-9_.]+$/.test(expo.android?.package || ""), "Missing or invalid Android package.");
check(expo.ios?.bundleIdentifier === expo.android?.package, "Android and iOS identifiers should match for this project.");
check(/^\d+$/.test(expo.ios?.buildNumber || ""), "iOS buildNumber must be numeric.");
check(Number.isInteger(expo.android?.versionCode) && expo.android.versionCode > 0, "Android versionCode must be a positive integer.");
check(Boolean(expo.description), "Expo description is missing.");
check(expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false, "iOS encryption declaration is missing.");
check(Boolean(expo.ios?.infoPlist?.NSLocationWhenInUseUsageDescription), "iOS location usage description is missing.");
check(Array.isArray(expo.plugins) && expo.plugins.some((plugin) => Array.isArray(plugin) && plugin[0] === "expo-location"), "expo-location plugin is not configured.");
check(!expo.android?.permissions, "Android permissions should be owned by Expo plugins to avoid duplicates.");

const icon = pngSize(expo.icon);
const adaptive = pngSize(expo.android.adaptiveIcon.foregroundImage);
const splash = pngSize(expo.splash.image);
const favicon = pngSize(expo.web.favicon);
check(icon.width === 1024 && icon.height === 1024, "App icon must be 1024x1024.");
check(adaptive.width === 1024 && adaptive.height === 1024, "Android adaptive foreground must be 1024x1024.");
check(splash.width >= 1024 && splash.height >= 1024, "Splash image is too small.");
check(favicon.width >= 48 && favicon.height >= 48, "Favicon must be at least 48x48.");

check(eas.cli?.appVersionSource === "local", "EAS appVersionSource must be local.");
check(eas.build?.production?.autoIncrement === true, "Production builds must auto-increment native build numbers.");
check(eas.build?.production?.android?.buildType === "app-bundle", "Android production build must produce an AAB.");
const serializedEas = JSON.stringify(eas);
check(!/INSERISCI|YOUR[-_ ]|TODO/i.test(serializedEas), "eas.json contains placeholder credentials.");
warn(Boolean(expo.extra?.eas?.projectId), "EAS projectId is not configured yet; run eas init before the first cloud build.");

for (const legalFile of ["public/privacy.html", "public/terms.html", "public/delete-account.html", "public/support.html"]) {
  check(fs.existsSync(path.join(root, legalFile)), `Missing legal page: ${legalFile}`);
}
for (const authRoute of ["app/auth-callback.tsx", "app/reset-password.tsx"]) {
  check(fs.existsSync(path.join(root, authRoute)), `Missing authentication deep-link route: ${authRoute}`);
}
const authContextSource = fs.readFileSync(path.join(root, "contexts/AuthContext.tsx"), "utf8");
check(authContextSource.includes('path: "auth-callback"'), "OAuth callback redirect is missing.");
check(authContextSource.includes('path: "reset-password"'), "Password recovery redirect is missing.");
check(authContextSource.includes("PASSWORD_REDIRECT_URI"), "Password recovery does not use its dedicated redirect.");


const runtimeRoots = ["app", "components", "contexts", "hooks", "lib", "services"];
const runtimeFiles = runtimeRoots.flatMap((dir) => walkFiles(path.join(root, dir), [".ts", ".tsx", ".js"]));
const forbidden = /wayra-api|onrender\.com|API_BASE_URL|\/api\/itinerary\/generate|backendFetch/;
const legacySupabaseCatalog = /\.from\((['"])(?:attractions|foods|culture_facts|city_info|neighborhoods)\1\)|functions\.invoke\((['"])(?:city-info|generate-itinerary)\2\)/;
for (const file of runtimeFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (forbidden.test(source)) {
    errors.push(`Backend runtime dependency found in ${path.relative(root, file)}.`);
  }
  if (legacySupabaseCatalog.test(source)) {
    errors.push(`Legacy Supabase catalog dependency found in ${path.relative(root, file)}.`);
  }
}
for (const file of runtimeFiles) {
  const source = fs.readFileSync(file, "utf8");
  const suspiciousLine = source.split(/\r?\n/).find((line) => {
    const quotedStrings = line.match(/(["'])(?:\\.|(?!\1).)*\1/g) || [];
    return quotedStrings.some((value) => {
      if (value.includes("://")) return false;
      return /[A-Za-zÀ-ÿ]\?[A-Za-zÀ-ÿ]/.test(value);
    });
  });
  if (suspiciousLine) {
    errors.push(`Possible corrupted UI text found in ${path.relative(root, file)}: ${suspiciousLine.trim()}`);
  }
}

const productionEnv = fs.readFileSync(path.join(root, ".env.production"), "utf8");
check(!forbidden.test(productionEnv), ".env.production still references the legacy backend.");

function hasCorruptedText(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/(?:https?|itms-apps):\/\/\S+/g, "").trim();
    if (!cleaned) return false;
    if (cleaned.includes("\uFFFD") || /\u00C3.|\u00E2\u20AC/.test(cleaned)) return true;
    const questionMarks = cleaned.match(/\?/g)?.length || 0;
    return questionMarks > 0 && !(questionMarks === 1 && cleaned.endsWith("?"));
  }
  if (Array.isArray(value)) return value.some(hasCorruptedText);
  if (value && typeof value === "object") return Object.values(value).some(hasCorruptedText);
  return false;
}

const cityDir = path.join(root, "assets", "cities");
const cityFiles = fs.readdirSync(cityDir).filter((name) => name.endsWith(".json")).sort();
const registrySource = fs.readFileSync(path.join(root, "data/cityRegistry.ts"), "utf8");
const registeredCityCount = (registrySource.match(/^\s*\{\s*id:\s*"[^"]+",\s*country:/gm) || []).length;
check(cityFiles.length === registeredCityCount, `Expected ${registeredCityCount} city packages from the registry, found ${cityFiles.length}.`);
let planCount = 0;
const missingNeighborhoodTranslations = { fr: [], es: [] };
for (const fileName of cityFiles) {
  const city = readJson(path.join("assets", "cities", fileName));
  check(Boolean(city.cityInfo), `${city.city}: practical information is missing.`);
  check(city.attractions?.length > 0, `${city.city}: attractions are missing.`);
  check(city.foodSpots?.length > 0, `${city.city}: food spots are missing.`);
  check(city.foods?.length === 8, `${city.city}: expected 8 typical foods.`);
  check(city.cultureFacts?.length > 0, `${city.city}: culture facts are missing.`);
  check(city.neighborhoods?.length > 0, `${city.city}: neighborhoods are missing.`);
  check(Object.keys(city.plans || {}).length === 36, `${city.city}: expected 36 itinerary plans.`);
  const visibleContent = [
    ...(city.attractions || []),
    ...(city.foodSpots || []),
    ...(city.foods || []),
    ...(city.cultureFacts || []),
    ...(city.neighborhoods || []),
    city.cityInfo,
  ];
  check(!hasCorruptedText(visibleContent), city.city + ": corrupted text marker found in visible content.");
  planCount += Object.keys(city.plans || {}).length;

  for (const language of ["fr", "es"]) {
    for (const neighborhood of city.neighborhoods || []) {
      const translation = neighborhood.translations?.[language];
      if (!translation?.description) {
        missingNeighborhoodTranslations[language].push(`${city.city}/${neighborhood.name}`);
      }
    }
  }
}
check(planCount === cityFiles.length * 36, `Expected ${cityFiles.length * 36} precomputed plans, found ${planCount}.`);

for (const language of ["fr", "es"]) {
  const missing = missingNeighborhoodTranslations[language];
  if (missing.length) {
    const message = `${missing.length} neighborhood descriptions are missing in ${language.toUpperCase()} (${new Set(missing.map((item) => item.split("/")[0])).size} cities).`;
    if (strict) errors.push(message);
    else warnings.push(message);
  }
}

check(pkg.dependencies?.expo === "~54.0.35", "Unexpected Expo version; review SDK compatibility.");
check(pkg.dependencies?.["expo-router"] === "~6.0.24", "Unexpected Expo Router version.");

console.log(`Wayra release preflight: ${cityFiles.length} cities, ${planCount} local plans.`);
for (const message of warnings) console.warn(`WARN: ${message}`);
for (const message of errors) console.error(`ERROR: ${message}`);
if (errors.length) {
  console.error(`Preflight failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(warnings.length ? `Preflight passed with ${warnings.length} warning(s).` : "Preflight passed.");
