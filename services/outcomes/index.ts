import { csvToOutcomeJsons } from "./mod.ts";
import { extractGithubRepo } from "../github.ts";

await extractGithubRepo("core-curriculum/data", "data_in_github");
console.log(`Writing outcome JSONs...`)
csvToOutcomeJsons();