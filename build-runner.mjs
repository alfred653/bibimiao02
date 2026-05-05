import * as esbuild from "esbuild";
import { writeFileSync } from "fs";

try {
  const result = await esbuild.build({
    entryPoints: ["D:/Coding/bibimiao02/src/api/_all.ts"],
    outfile: "D:/Coding/bibimiao02/dist-api/handlers.js",
    platform: "node",
    target: "es2023",
    format: "esm",
    packages: "external",
    bundle: true,
  });
  writeFileSync("D:/Coding/bibimiao02/build-result.txt", "SUCCESS: " + JSON.stringify(result) + "\n");
  console.log("SUCCESS");
} catch (err) {
  writeFileSync("D:/Coding/bibimiao02/build-result.txt", "ERROR: " + err.message + "\n" + err.stack + "\n");
  console.error("ERROR:", err.message);
}
