import { csvToOutcomeJsons } from "../services/outcomes/mod.ts";
import { extractGithubRepo } from "../services/github.ts";

await extractGithubRepo("core-curriculum/data", "data_in_github");
csvToOutcomeJsons();
