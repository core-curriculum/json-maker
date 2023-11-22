import * as path from "node:path";
import { Locale } from "../locale.ts";


const rootDir = path.resolve(process.cwd());
const dataDir = path.resolve(rootDir, "data_in_github");
const outcomeDir = (locale: Locale) => path.resolve(dataDir, "2022", locale, "outcomes");
const tableDir = (locale: Locale) => path.resolve(dataDir, "2022", locale, "tables");

export { rootDir, dataDir, outcomeDir, tableDir };
