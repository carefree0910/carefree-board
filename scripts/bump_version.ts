import { getPackages } from "./utils.ts";

const packages = getPackages();
for (const pkg of packages) {
  const denoPath = new URL(`../${pkg}/deno.json`, import.meta.url);
  const denoJson = JSON.parse(Deno.readTextFileSync(denoPath));
  const version = denoJson.version as string;
  const [major, minor, patch] = version.split(".").map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}`;
  denoJson.version = newVersion;
  Deno.writeTextFileSync(denoPath, JSON.stringify(denoJson, null, 2) + "\n");
}
console.log("%cPatch version bumped!", "color:green");
