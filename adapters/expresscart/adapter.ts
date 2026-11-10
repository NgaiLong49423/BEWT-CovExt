import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExpressCartExperimentAdapter } from "./experiment.js";
import type { ApplicationAdapter } from "../../framework/src/contracts.js";

export class ExpressCartAdapter extends ExpressCartExperimentAdapter implements ApplicationAdapter {
  constructor(repositoryRoot: string, manifestInput?: unknown) {
    const raw = manifestInput ?? JSON.parse(
      readFileSync(join(repositoryRoot, "config/apps/expresscart.json"), "utf8")
    );
    super(repositoryRoot, raw);
  }
}
