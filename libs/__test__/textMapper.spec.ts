import { mapText, applyMappedInfo } from "@libs/textMapper";
import type { ReplaceMap } from "@libs/textMapper";

const getReplaceMap: () => ReplaceMap<Record<string, string>> = () => {
  let tableIndex = 1;
  return [
    {
      reg: /意味付け|ある型/,
      mapper: ([text]: RegExpExecArray) => {
        const map: Record<string, string> = {
          意味付け: "meaning",
          ある型: "typing",
        };
        return {
          text: `「${text}」`,
          attr: { type: "en", en: map[text] },
        };
      },
    },
    {
      reg: /\[\@tbl:(.+?)\]/,
      mapper: ([, id]: RegExpExecArray) => {
        return {
          text: `表.${tableIndex++}`,
          attr: { type: "table", id },
        };
      },
    },
  ];
};

const text = `filter の返り値([@tbl:return])の に is を使って"ある型([@tbl:type])である"と意味付けします。`;
const replacedText =
  'filter の返り値(表.1)の に is を使って"「ある型」(表.2)である"と「意味付け」します。';
const textMappedSnapshot = {
  infoList: [
    { gap: 12, length: 3, info: { type: "table", id: "return" } },
    { gap: 13, length: 5, info: { type: "en", en: "typing" } },
    { gap: 1, length: 3, info: { type: "table", id: "type" } },
    { gap: 6, length: 6, info: { type: "en", en: "meaning" } },
  ],
  text: replacedText,
};

describe("mapText", () => {
  test("test string mathced snapshot", () => {
    const map = getReplaceMap();
    const res = mapText(text, map);
    expect(res).toEqual(textMappedSnapshot);
  });
  test("test string with no match", () => {
    const map = getReplaceMap();
    const testText = "test text";
    const res = mapText(testText, map);
    expect(res).toEqual({ infoList: [], text: testText });
  });
  test("test empty string", () => {
    const map = getReplaceMap();
    const testText = "";
    const res = mapText(testText, map);
    expect(res).toEqual({ infoList: [], text: testText });
  });
  test("applyMappedInfo", () => {
    const map = textMappedSnapshot.infoList as {
      gap: number;
      length: number;
      info: { type: "en"; en: string } | { type: "table"; id: string };
    }[];
    const res = applyMappedInfo(replacedText, map, (text, info) => {
      switch (info.type) {
        case "en":
          return `<span title="${info.en}">${text}</span>`;
        case "table":
          return `<a href="#${info.id}">${text}</a>`;
      }
    });
    expect(res.join("")).toEqual(
      // eslint-disable-next-line max-len
      `filter の返り値(<a href="#return">表.1</a>)の に is を使って"<span title="typing">「ある型」</span>(<a href="#type">表.2</a>)である"と<span title="meaning">「意味付け」</span>します。`,
    );
  });
});
