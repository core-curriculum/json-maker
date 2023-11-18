import { ensureDirExists } from "mkdir_recursive";
import { localeList } from "../paths.ts";
import { loadFullOutcomesTable, makeOutcomesTree } from "./outcomes.ts";
import { getAllTables, loadTableInfoDict } from "./tables.ts";

const csvToOutcomeJsons = async () => {
  return await Promise.all(localeList.map(async (locale) => {
    const tableInfo = loadTableInfoDict(locale);
    const { attrInfo: tableAttrInfo, tables } = getAllTables(locale);
    const { outcomeList, idTree, attrInfo: outcomeAttrInfo } = makeOutcomesTree(
      loadFullOutcomesTable(locale),
      tableInfo,
      locale,
    );
    const attrInfo = { ...tableAttrInfo, ...outcomeAttrInfo };
    const idList = [...outcomeList, ...tables];
    const dir = `../../output/${locale}`;
    await ensureDirExists(new URL(dir, import.meta.url));
    const dirPath = new URL(dir, import.meta.url).pathname;
    console.log(`Writing to ${dirPath}`);
    Deno.writeTextFileSync(
      `${dirPath}/table_info.json`,
      JSON.stringify(tableInfo, null, 2),
    );
    Deno.writeTextFileSync(
      `${dirPath}/attr_info.json`,
      JSON.stringify(attrInfo, null, 2),
    );
    Deno.writeTextFileSync(
      `${dirPath}/outcome_tree.json`,
      JSON.stringify(idTree, null, 2),
    );
    Deno.writeTextFileSync(`${dirPath}/id_list.json`, JSON.stringify(idList, null, 2));
  }));
}

export { csvToOutcomeJsons }
export { type LayerHeaders, loadOutcomes, loadTableIndex, loadTable } from "./loadCsv.ts"
export { getTableFiles } from "./tables.ts"
