import * as path from "path";
import { parseCSV } from "../libs/parseCSV.ts";
import { outcomeDir, tableDir } from "./paths.ts";
import type { Locale} from "./paths.ts"

const readTextFileSync = Deno.readTextFileSync;

type Table<HEADER extends ReadonlyArray<string> = readonly string[]> = [
  readonly [...HEADER],
  ...ReadonlyArray<ReadonlyArray<string>>,
];
type LayerHeaderCommon = readonly ["index", "id", "item"];
type LayerHeader1 = readonly [...LayerHeaderCommon, "description", "spell"];
type LayerHeader2 = readonly [...LayerHeaderCommon, "description", "parent"];
type LayerHeader3 = readonly [...LayerHeaderCommon, "parent"];
type LayerHeader4 = readonly [...LayerHeaderCommon, "parent"];
type LayerHeaders = {
  "1": LayerHeader1;
  "2": LayerHeader2;
  "3": LayerHeader3;
  "4": LayerHeader4;
};
type LayerTag = keyof LayerHeaders;
type TableIndexHeader = readonly ["file", "item", "id", "legend", "number", "index", "columns"];

const loadCsv = <HEADER extends readonly string[] = string[]>(path: string) => {
  const data = readTextFileSync(path);
  const res = parseCSV(data);
  if (!res.ok) throw new Error(`error parsing file:${path}`);
  return res.value as unknown as Table<HEADER>;
};

const makeCache = <T>() => {
  const cache = new Map<string, T>();
  return (key: string, getFunc: (key: string) => T) => {
    if (cache.has(key)) {
      return cache.get(key) as T;
    } else {
      const value = getFunc(key);
      cache.set(key, value);
      return value;
    }
  };
};
const cachedTable = makeCache<Table>();
const loadCachedTable = (filename: string) => {
  const load = (file: string) => {
    const data = loadCsv(file);
    return data;
  };
  return cachedTable(filename, load);
};

const loadOutcomes = <T extends LayerTag>(layer: T, locale: Locale) => {
  const filename = path.resolve(outcomeDir(locale), `layer${layer}.csv`);
  return loadCachedTable(filename) as Table<LayerHeaders[T]>;
};

const loadTable = (tableFile: string, locale: Locale) => {
  const filename = path.resolve(tableDir(locale), `${tableFile}.csv`);
  return loadCachedTable(filename);
};

const loadTableIndex = (locale: Locale) => {
  const filename = path.resolve(tableDir(locale), `index.csv`);
  return loadCachedTable(filename) as Table<TableIndexHeader>;
};

export { loadOutcomes, loadTable, loadTableIndex };
