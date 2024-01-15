import { loadCsvAsDictList } from "../load-csv-as-dict-list.ts";
import { writeTextFile } from "../writeTextFile.ts";
import { localeList } from "../locale.ts";

const url = {
  ja: "https://docs.google.com/spreadsheets/d/1lQ95udBDNTe1elThvIfAbtO7YqfByGCZywg0H0uy6qE/export?format=csv&gid=25163266",
  en: "https://docs.google.com/spreadsheets/d/1lQ95udBDNTe1elThvIfAbtO7YqfByGCZywg0H0uy6qE/export?format=csv&gid=25163266",
}


const writeContributorsFromGoogleSpreadSheet = async () => {
  await Promise.all(localeList.map(async locale => {
    const data = await loadCsvAsDictList(url[locale]);
    writeTextFile(`./output/contributors/${locale}.json`, JSON.stringify(data, null, 2));
  }))
}

export { writeContributorsFromGoogleSpreadSheet }