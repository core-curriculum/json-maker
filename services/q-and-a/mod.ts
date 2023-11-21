import { loadCsvAsDictList } from "../load-csv-as-dict-list.ts";
import { writeTextFile } from "../writeTextFile.ts";

const url = "https://docs.google.com/spreadsheets/d/1xGi_y12VTi2KxLwqqq7ad7mDljNRAfKXI-JkGl0K04Y/export?format=csv&gid=0";

const writeQandADataFromGoogleSpreadSheet = async () => {
  const data = await loadCsvAsDictList(url);
  writeTextFile("./output/q-and-a.json", JSON.stringify(data, null, 2));
}

export { writeQandADataFromGoogleSpreadSheet }