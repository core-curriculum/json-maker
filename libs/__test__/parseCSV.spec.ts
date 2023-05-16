import { parseCSV } from "@libs/parseCSV";

/* eslint-disable max-len */
const csvString = `"第1層イニシャル","第1層","第2層","第3層","第4層","id","id","H28対応項目"
PR,プロフェッショナリズム,信頼,"誠実さ","患者や社会に対して誠実である行動とはどのようなものかを考え、そのように行動する。","PR-01-01-01","JkxiJUs","A-01-03-na-01"
"PR","プロフェッショナリズム","信頼","誠実さ","社会から信頼される専門職集団の一員であるためにはどのように行動すべきかを考え、そのように行動することができる。
","PR-01-01-02","JkxiJUw","A-01-03-na-01"
"PR","プロフェッショナリズム","信頼","省察",,"PR-01-02-01","JkxiJU4",
`;
/* eslint-enable max-len */
const csvStringResult = {
  ok: true,
  pos: 345,
  value: [
    ["第1層イニシャル", "第1層", "第2層", "第3層", "第4層", "id", "id", "H28対応項目"],
    [
      "PR",
      "プロフェッショナリズム",
      "信頼",
      "誠実さ",
      "患者や社会に対して誠実である行動とはどのようなものかを考え、そのように行動する。",
      "PR-01-01-01",
      "JkxiJUs",
      "A-01-03-na-01",
    ],
    [
      "PR",
      "プロフェッショナリズム",
      "信頼",
      "誠実さ",
      "社会から信頼される専門職集団の一員であるためにはどのように行動すべきかを考え、そのように行動することができる。\n",
      "PR-01-01-02",
      "JkxiJUw",
      "A-01-03-na-01",
    ],
    ["PR", "プロフェッショナリズム", "信頼", "省察", "", "PR-01-02-01", "JkxiJU4", ""],
  ],
};

describe("parseCsvString", () => {
  test("parseCsv", () => {
    const res = parseCSV(csvString);
    expect(res.ok).toBeTruthy();
    expect(res).toEqual(csvStringResult);
  });
});
