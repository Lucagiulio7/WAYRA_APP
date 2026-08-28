const { existsSync } = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const script = path.resolve(root, "../backend/scripts/audit_external_links.py");
const forwarded = process.argv.slice(2);
const candidates = process.platform === "win32"
  ? [
      [path.resolve(root, "../backend/venv/Scripts/python.exe")],
      [path.resolve(root, "../backend/.venv/Scripts/python.exe")],
      ["py", "-3"],
      ["python"],
    ]
  : [
      [path.resolve(root, "../backend/venv/bin/python")],
      [path.resolve(root, "../backend/.venv/bin/python")],
      ["python3"],
      ["python"],
    ];

for (const candidate of candidates) {
  const executable = candidate[0];
  if ((executable.includes(path.sep) || path.isAbsolute(executable)) && !existsSync(executable)) continue;
  const result = spawnSync(executable, [...candidate.slice(1), script, ...forwarded], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (!result.error || result.error.code !== "ENOENT") process.exit(result.status ?? 1);
}

console.error("Python 3 non trovato: attiva il venv backend oppure installa Python 3.");
process.exit(1);
