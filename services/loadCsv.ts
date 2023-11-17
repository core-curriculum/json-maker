import * as path from "path";
import { parseCSV } from "../libs/parseCSV.ts";
import { outcomeDir, tableDir } from "./paths.ts";
import type { Locale } from "./paths.ts"

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

type Tables = {
  TBL0100: [["index", "id", "system", "category", "item", "core"], ...readonly (readonly string[])[]],
  TBL0201: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0202: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0203: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0204: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0205: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0206: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0207: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0208: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0209: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0210: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0211: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0212: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0213: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0214: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0215: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0216: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0217: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0218: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0219: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0220: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
  TBL0300: [["index", "id", "item"], ...readonly (readonly string[])[]],
  TBL0400: [["index", "id", "item"], ...readonly (readonly string[])[]],
  TBL0500: [["index", "id", "item", "ddx"], ...readonly (readonly string[])[]],
  TBL0600: [["index", "id", "item"], ...readonly (readonly string[])[]],
  TBL0700: [["index", "id", "category", "item"], ...readonly (readonly string[])[]],
}

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

const loadTable = <T extends keyof Tables>(tableFile: T, locale: Locale) => {
  const filename = path.resolve(tableDir(locale), `${tableFile}.csv`);
  return loadCachedTable(filename) as Table<Tables[T][0]>;
};

const loadTableIndex = (locale: Locale) => {
  const filename = path.resolve(tableDir(locale), `index.csv`);
  return loadCachedTable(filename) as Table<TableIndexHeader>;
};

export { loadOutcomes, loadTable, loadTableIndex, type LayerHeaders, type Tables, type LayerTag };
