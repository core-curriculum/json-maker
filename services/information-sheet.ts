import { loadCsvAsDictList } from "./load-csv-as-dict-list";
import { writeTextFile } from "./writeTextFile";
import path from "path";

const url = "https://docs.google.com/spreadsheets/d/1zOu69gKmRuutpx2AtvWCSpztiKfwvveCAaW5biEoJVE/export?format=csv&gid=0";

// load CSV table
const csvTable = await loadCsvAsDictList(url);
if(!csvTable || !csvTable.length) {
  throw new Error("Failed to load CSV");
}

// write each CSV data to JSON
const promises = csvTable.map(async info => {
  const {csv_url:csvUrl,dist_path:distPath} = info;
  const csvData = await loadCsvAsDictList(csvUrl);
  if(!csvData) {
    console.log(`Failed to load ${csvUrl}`);
    return; 
  }
  const dist = path.join("output",distPath);
  console.log(`Writing ${dist} (count: ${csvData.length})`);
  writeTextFile(dist, JSON.stringify(csvData, null, 2));
});
await Promise.all(promises);