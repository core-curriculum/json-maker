import * as path from "https://deno.land/std@0.187.0/path/mod.ts"

const localeList = ["en", "ja"] as const;
type Locale = typeof localeList[number];

const rootDir = path.resolve(Deno.cwd());
const dataDir = path.resolve(rootDir, "data_in_github");
const outcomeDir = (locale: Locale) => path.resolve(dataDir, "2022", locale, "outcomes");
const tableDir = (locale: Locale) => path.resolve(dataDir, "2022", locale, "tables");

export { rootDir, dataDir, outcomeDir, tableDir,localeList };
export type {Locale};
