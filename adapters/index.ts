import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppId, ApplicationAdapter } from "../framework/src/contracts.js";
import { BaseApplicationAdapter, type IsolatedAppWorkspace } from "./base-adapter.js";
import { BluditAdapter } from "./bludit/adapter.js";
import { ClarolineAdapter } from "./claroline/adapter.js";
import { ExpressCartAdapter } from "./expresscart/adapter.js";
import { ExpressCartExperimentAdapter } from "./expresscart/experiment.js";
import { JoomlaAdapter } from "./joomla/adapter.js";
import { KanboardAdapter } from "./kanboard/adapter.js";
import { MantisBTAdapter } from "./mantisbt/adapter.js";
import { MediaWikiAdapter } from "./mediawiki/adapter.js";
import { PrestaShopAdapter } from "./prestashop/adapter.js";

export {
  BaseApplicationAdapter,
  type IsolatedAppWorkspace,
  BluditAdapter,
  ClarolineAdapter,
  ExpressCartAdapter,
  ExpressCartExperimentAdapter,
  JoomlaAdapter,
  KanboardAdapter,
  MantisBTAdapter,
  MediaWikiAdapter,
  PrestaShopAdapter,
};

export function createApplicationAdapter(
  appId: AppId,
  repositoryRoot: string,
  manifestInput?: unknown
): ApplicationAdapter {
  const manifest = manifestInput ?? JSON.parse(
    readFileSync(join(repositoryRoot, `config/apps/${appId}.json`), "utf8")
  );

  switch (appId) {
    case "bludit":
      return new BluditAdapter(repositoryRoot, manifest);
    case "claroline":
      return new ClarolineAdapter(repositoryRoot, manifest);
    case "expresscart":
      return new ExpressCartAdapter(repositoryRoot, manifest);
    case "joomla":
      return new JoomlaAdapter(repositoryRoot, manifest);
    case "kanboard":
      return new KanboardAdapter(repositoryRoot, manifest);
    case "mantisbt":
      return new MantisBTAdapter(repositoryRoot, manifest);
    case "mediawiki":
      return new MediaWikiAdapter(repositoryRoot, manifest);
    case "prestashop":
      return new PrestaShopAdapter(repositoryRoot, manifest);
    default: {
      const exhaustiveCheck: never = appId;
      throw new Error(`Unsupported application ID: ${exhaustiveCheck}`);
    }
  }
}

export const getAdapterForApp = createApplicationAdapter;
