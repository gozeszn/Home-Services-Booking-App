const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const backend = path.resolve(__dirname, "..");
function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(target) : entry.name.endsWith(".js") ? [target] : [];
  });
}

function hasExactCase(target) {
  const root = path.parse(target).root;
  let current = root;
  for (const part of target.slice(root.length).split(path.sep).filter(Boolean)) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory() ||
        !fs.readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return fs.existsSync(current) && fs.statSync(current).isFile();
}

let failures = 0;
const files = collect(backend);
for (const file of files) {
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (syntax.status !== 0) {
    console.error(syntax.stderr || syntax.error?.message || "Syntax check failed: " + file);
    failures++;
  }
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/require\(\s*["'](\.[^"']+)["']\s*\)/g)) {
    const target = path.resolve(path.dirname(file), match[1]);
    if (![target, target + ".js", target + ".json", path.join(target, "index.js")].some(hasExactCase)) {
      console.error("Missing or incorrectly cased import:", path.relative(backend, file), match[1]);
      failures++;
    }
  }
}
console.log("Checked " + files.length + " backend JavaScript files; " + failures + " issue(s).");
process.exitCode = failures ? 1 : 0;
