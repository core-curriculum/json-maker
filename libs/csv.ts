const toCsv = (table: string[][]) => {
  const lineBreak = "\n";
  const endQuote = '"';
  const startQuote = '"';
  const splitChar = `,`;
  const specificChar = [splitChar, startQuote, endQuote, lineBreak];
  const lines = table.map(line =>
    line
      .map(cell => {
        const needQuote = specificChar.some(char => cell.includes(char));
        const escaped = cell.replace(new RegExp(startQuote, "g"), startQuote + startQuote);
        return needQuote ? startQuote + escaped + endQuote : escaped;
      })
      .join(splitChar),
  );
  return lines.join(lineBreak);
};

const ensureWithBom = (text: string) => {
  const bom = "\uFEFF";
  return text.startsWith(bom) ? text : bom + text;
};

const ensureWithoutBom = (text: string) => {
  const bom = "\uFEFF";
  return text.startsWith(bom) ? text.substring(bom.length) : text;
};

const toDataUrl = (table: string[][], { withBom = true }: { withBom: boolean }) => {
  const csv = toCsv(table);
  const text = withBom ? ensureWithBom(csv) : ensureWithoutBom(csv);
  return "data:text/text;base64, " + Buffer.from(text).toString("base64");
};

type OkResult<T> = { ok: true; value: T; pos: number };
type FailResult = { ok: false };
type Result<T> = OkResult<T> | FailResult;
interface Parser<T> {
  (text: string, pos: number): Result<T>;
}

const regParser: (regStr: string) => Parser<string> =
  (regStr: string) => (text: string, pos: number) => {
    const regObj = new RegExp(regStr, "ym");
    const match = text.substring(pos).match(regObj);
    if (match && match.length <= 0) {
      throw new Error(`regStr should contains at least one group: got "${regStr}"`);
    }
    return match !== null
      ? { ok: true, value: match[1], pos: pos + match[0].length }
      : { ok: false };
  };

const stringParser: (str: string) => Parser<string> =
  (str: string) => (text: string, pos: number) =>
    text.startsWith(str, pos) ? { ok: true, value: str, pos: pos + str.length } : { ok: false };

const map: <T, U>(parser: Parser<T>, f: (value: T) => U) => Parser<U> =
  <T, U>(parser: Parser<T>, f: (value: T) => U) =>
    (text: string, pos: number) => {
      const res = parser(text, pos);
      return res.ok ? { ok: true, pos: res.pos, value: f(res.value) } : res;
    };
const or: <T>(...parsers: [...Parser<T>[]]) => Parser<T> =
  <T>(...parsers: [...Parser<T>[]]) =>
    (text: string, pos: number) => {
      for (const parser of parsers) {
        const res = parser(text, pos);
        if (res.ok) return res;
      }
      return { ok: false };
    };
const seq: <T>(...parsers: [...Parser<T>[]]) => Parser<T[]> =
  <T>(...parsers: [...Parser<T>[]]) =>
    (text: string, pos: number) => {
      const value = [];
      let currentPos = pos;
      for (const parser of parsers) {
        const res = parser(text, currentPos);
        if (!res.ok) return { ok: false };
        currentPos = res.pos;
        value.push(res.value);
      }
      return { ok: true, pos: currentPos, value };
    };

const many: <T>(parser: Parser<T>) => Parser<T[]> =
  <T>(parser: Parser<T>) =>
    (text: string, pos: number) => {
      const value = [];
      let currentPos = pos;
      while (true) {
        const res = parser(text, currentPos);
        if (!res.ok) break;
        currentPos = res.pos;
        value.push(res.value);
      }
      return { ok: true, pos: currentPos, value };
    };

const skipFirst: <T>(first: Parser<unknown>, second: Parser<T>) => Parser<T> =
  <T>(first: Parser<unknown>, second: Parser<T>) =>
    (text: string, pos: number) => {
      const res = first(text, pos);
      return res.ok ? second(text, res.pos) : res;
    };

const skipSecond: <T>(first: Parser<T>, second: Parser<unknown>) => Parser<T> =
  <T>(first: Parser<T>, second: Parser<unknown>) =>
    (text: string, pos: number) => {
      const res = first(text, pos);
      if (!res.ok) return res;
      return second(text, res.pos).ok ? res : { ok: false };
    };

const quoted =
  <T>(startQuote: Parser<unknown>, parser: Parser<T>, endQuote: Parser<unknown>) =>
    (text: string, pos: number) => {
      const res = startQuote(text, pos);
      if (!res.ok) return { ...res, pos };
      const res2 = parser(text, res.pos);
      if (!res2.ok) return { ...res2, pos };
      const res3 = endQuote(text, res2.pos);
      if (!res3.ok) return { ...res3, pos };
      return { ok: true, pos: res3.pos, value: res2.value };
    };

const seqBy: <T>(parser: Parser<T>, sep: Parser<unknown>) => Parser<T[]> =
  <T>(parser: Parser<T>, sep: Parser<unknown>) =>
    (text: string, pos: number) => {
      const first = parser(text, pos);
      if (!first.ok) return first;
      const unit = skipFirst(sep, parser);
      const units = many(unit);
      const res = units(text, first.pos);
      if (!res.ok) return res;
      return { ok: true, pos: res.pos, value: [first.value, ...res.value] };
    };

const eof: Parser<null> = (text: string, pos: number) =>
  pos >= text.length ? { ok: true, pos, value: null } : { ok: false };

const parseCSV = (text: string) => {
  const lineBreak = String.raw`\n`;
  const splitChar = `,`;

  const simpleItem: Parser<string> = regParser(`([^${splitChar}${lineBreak}]*)`);
  const escapedQuote = map(stringParser(`""`), () => `"`);
  const quotedItemContent: Parser<string> = map(many(or(escapedQuote, regParser(`([^"])`))), arr =>
    arr.join(""),
  );
  const quotedItem = quoted(stringParser(`"`), quotedItemContent, stringParser(`"`));
  const item = or(quotedItem, simpleItem);
  const split = regParser(` *(${splitChar}) *`);
  const line = seqBy(item, split);
  const lines = seqBy(line, regParser(lineBreak));
  const end = seq(regParser(`([\n \r]*)`), eof);
  return skipSecond(lines, end)(text.trim().replaceAll("\r", ""), 0);
};

export { ensureWithBom, ensureWithoutBom, parseCSV, toCsv, toDataUrl };
