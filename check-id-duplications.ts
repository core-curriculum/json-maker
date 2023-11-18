import { toObjectList } from "./libs/tableUtils.ts";
import { Locale } from "./services/paths.ts";
import { getTableFiles, LayerHeaders, loadOutcomes, loadTable, loadTableIndex } from "./services/outcomes/mod.ts";

const locale: Locale = "en"

const outcomes = (["1", "2", "3", "4"] as (keyof LayerHeaders)[])
  .map(key => loadOutcomes(key, locale))
  .map(table => toObjectList<string, ["index", "id", "item", ...string[]]>(table)).flat();

const tableFiles = getTableFiles(locale);
const tables = tableFiles
  .map(tableFile => loadTable(tableFile, locale))
  .map(table => toObjectList<string, ["index", "id", ...string[]]>(table)).flat();


const tableIndex = toObjectList(loadTableIndex(locale));

const wholeItems = [...outcomes, ...tables, ...tableIndex];
const ids = wholeItems.map(item => item.id);

const showDuplicate = <T>(array: T[]) => [...new Set(array.filter((item, index, self) => self.indexOf(item) !== index))];

console.log(`Duplications are ${showDuplicate(ids)}`);

