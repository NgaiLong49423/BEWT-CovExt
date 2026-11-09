import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseApplicationManifest } from "../../../../framework/src/contracts.js";
import { verifyExpressCartSourceInputs } from "../../../../adapters/expresscart/source-identity.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
const manifest = parseApplicationManifest(JSON.parse(await readFile(resolve(repositoryRoot, "config/apps/expresscart.json"), "utf8")));
const evidence = await verifyExpressCartSourceInputs(repositoryRoot, manifest);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
