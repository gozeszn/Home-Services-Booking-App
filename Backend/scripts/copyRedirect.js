const fs = require("fs");
const path = require("path");

const source = path.join(
  process.cwd(),
  "Frontend",
  "public",
  "_redirects"
);

const destination = path.join(
  process.cwd(),
  "Frontend",
  "dist",
  "_redirects"
);

fs.copyFileSync(source, destination);

console.log("✓ _redirects copied to Frontend/dist");