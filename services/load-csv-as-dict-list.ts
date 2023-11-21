import { parseCSV, ensureWithoutBom } from "../libs/csv.ts";

export const loadCsvAsDictList = async (url: string) => {
  const text = await fetch(url).then(res => res.text());
  if (!text)
    return null;
  const res = parseCSV(ensureWithoutBom(text));
  const [header, ...body] = res.ok ? (res.value as string[][]) : ([] as string[][]);
  const data = body.map(row => {
    const zipped = header.map((key, i) => [key, row[i]]);
    return Object.fromEntries(zipped) as Record<string, string>;
  });
  return data;
};
