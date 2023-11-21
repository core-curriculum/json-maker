import { loadTable } from "../services/outcomes/mod.ts";
import { Locale } from "../services/paths.ts";
import { getTableFiles } from "../services/outcomes/mod.ts";

const locale: Locale = "en";

const tableFiles = getTableFiles(locale);
const tableTypes = `type Tables = {
${tableFiles
                .map(tableFile => [tableFile, loadTable(tableFile, locale)[0]] as const)
                .map(([key, headers]) => `  ${key}: [${JSON.stringify(headers)},...readonly (readonly string[])[]],`).join("\n")}
}
  
`

console.log(tableTypes);
