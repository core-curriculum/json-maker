import { loadCsvAsDictList } from "../load-csv-as-dict-list.ts";
import { writeTextFile } from "../writeTextFile.ts";
import { localeList } from "../locale.ts";

const url = {
  ja: "https://docs.google.com/spreadsheets/d/1xGi_y12VTi2KxLwqqq7ad7mDljNRAfKXI-JkGl0K04Y/export?format=csv&gid=0",
  en: "https://docs.google.com/spreadsheets/d/1xGi_y12VTi2KxLwqqq7ad7mDljNRAfKXI-JkGl0K04Y/export?format=csv&gid=0",
}


const writeQandADataFromGoogleSpreadSheet = async () => {
  await Promise.all(localeList.map(async locale => {
    const data = await loadCsvAsDictList(url[locale]);
    writeTextFile(`./output/q-and-a/${locale}.json`, JSON.stringify(data, null, 2));
  }))
}

export { writeQandADataFromGoogleSpreadSheet }