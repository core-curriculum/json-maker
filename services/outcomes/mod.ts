import { writeTextFile } from "../writeTextFile.ts";
import * as path from "path";
import { localeList } from "../locale.ts";
import { loadFullOutcomesTable, makeOutcomesTree } from "./outcomes.ts";
import { getAllTables, loadTableInfoDict } from "./tables.ts";

const csvToOutcomeJsons = () => {
  return localeList.map((locale) => {
    const tableInfo = loadTableInfoDict(locale);
    const { attrInfo: tableAttrInfo, tables } = getAllTables(locale);
    const { outcomeList, idTree, attrInfo: outcomeAttrInfo } = makeOutcomesTree(
      loadFullOutcomesTable(locale),
      tableInfo,
      locale,
    );
    const attrInfo = { ...tableAttrInfo, ...outcomeAttrInfo };
    const idList = [...outcomeList, ...tables];
    const dir = `output/outcomes/${locale}`;
    writeTextFile(
      path.join(dir, "table_info.json"),
      JSON.stringify(tableInfo, null, 2),
    );
    writeTextFile(
      path.join(dir, "attr_info.json"),
      JSON.stringify(attrInfo, null, 2),
    );
    writeTextFile(
      path.join(dir, "outcome_tree.json"),
      JSON.stringify(idTree, null, 2),
    );
    writeTextFile(
      path.join(dir, "id_list.json"),
      JSON.stringify(idList, null, 2),
    );
  });
}

export { csvToOutcomeJsons }
export { type LayerHeaders, loadOutcomes, loadTableIndex, loadTable } from "./loadCsv.ts"
export { getTableFiles } from "./tables.ts"
