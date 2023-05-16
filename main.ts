import {
  loadFullOutcomesTable,
  makeOutcomesTree,
} from "./services/outcomes.ts";
import { getAllTables, loadTableInfoDict } from "./services/tables.ts";
import { ensureDirExists } from "mkdir_recursive";
import { extractGithubRepo } from "./services/github.ts";
import { localeList } from "./services/paths.ts";

await extractGithubRepo("core-curriculum/data", "data_in_github");

Promise.all(localeList.map(async (locale) => {
  const tableInfo = loadTableInfoDict(locale);
  const { attrInfo: tableAttrInfo, tables } = getAllTables(locale);
  const { outcomeList, idTree, attrInfo: outcomeAttrInfo } = makeOutcomesTree(
    loadFullOutcomesTable(locale),
    tableInfo,
    locale,
  );
  const attrInfo = { ...tableAttrInfo, ...outcomeAttrInfo };
  const idList = [...outcomeList, ...tables];
  const dir = `./output/${locale}`;
  await ensureDirExists(new URL(dir, import.meta.url));
  Deno.writeTextFileSync(
    `${dir}/table_info.json`,
    JSON.stringify(tableInfo, null, 2),
  );
  Deno.writeTextFileSync(
    `${dir}/attr_info.json`,
    JSON.stringify(attrInfo, null, 2),
  );
  Deno.writeTextFileSync(
    `${dir}/outcome_tree.json`,
    JSON.stringify(idTree, null, 2),
  );
  Deno.writeTextFileSync(`${dir}/id_list.json`, JSON.stringify(idList, null, 2));
}));
