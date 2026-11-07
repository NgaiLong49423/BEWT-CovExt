import path from "node:path";
import { config } from "dotenv";
import { inspectBaseline, revalidateRun, runAgent } from "./workflow.js";

config({ path: path.resolve(import.meta.dirname, "../../.env"), override: true });

const command = process.argv[2] ?? "inspect";
if (command === "inspect") inspectBaseline();
else if (command === "agent") await runAgent();
else if (command === "revalidate") revalidateRun(process.argv[3] ?? "");
else {
  console.error("Usage: npm run inspect | npm run agent");
  process.exitCode = 2;
}
