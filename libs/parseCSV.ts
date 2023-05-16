const lineBreak = String.raw`\n`;
const endQuote = String.raw`\"`;
const startQuote = String.raw`\"`;
const splitChar = `,`;

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
    if (match && match.length <= 0)
      throw new Error(`regStr should contains at least one group: got "${regStr}"`);
    return match !== null
      ? { ok: true, value: match[1], pos: pos + match[0].length }
      : { ok: false };
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

const simpleItem: Parser<string> = regParser(`([^${splitChar}${lineBreak}]*)`);
const quotedItem: Parser<string> = regParser(`${startQuote}([^${endQuote}}]*)${endQuote}`);
const item = or(quotedItem, simpleItem);
const split = regParser(` *(${splitChar}) *`);
const line = seqBy(item, split);
const lines = seqBy(line, regParser(lineBreak));
const end = seq(regParser(`([\n \r]*)`), eof);
const parseCSV = (text: string) => skipSecond(lines, end)(text.trim(), 0);

export { parseCSV };
