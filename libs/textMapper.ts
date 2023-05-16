type MapperResult<T> = {
  text: string;
  attr: T;
};
type MapperResultWithPos<T> = MapperResult<T> & {
  gap: number;
};
type MappedInfo<T> = {
  info: T;
  gap: number;
  length: number;
};
type MappedText<T> = {
  text: string;
  infoList: MappedInfo<T>[];
}
type TextMapper<T> = (res: RegExpExecArray) => MapperResult<T>;
type ReplaceMap<T> = { reg: RegExp; mapper: TextMapper<T> }[];
const mapText = <T>(text: string, replaceMap: ReplaceMap<T>): MappedText<T> => {
  const seek: (str: string) => (string | MapperResultWithPos<T> | null)[] = (str: string) => {
    const res = replaceMap.reduce(
      (curr, { reg, mapper }) => {
        const currReg = new RegExp(reg, "g");
        const res = currReg.exec(str);
        if (!res || currReg.lastIndex === 0 || res.index > curr.prev.length) return curr;
        const prev = str.substring(0, res.index);
        const next = str.substring(currReg.lastIndex);
        return { prev, elm: { gap: prev.length, ...mapper(res) }, next };
      },
      { prev: str, elm: null as null | MapperResultWithPos<T>, next: "" },
    );
    return [res.prev, res.elm, ...(res.next ? seek(res.next) : [])];
  };
  const res = seek(text).filter(
    (v): v is string | MapperResultWithPos<T> => v !== null && v !== "",
  );
  const infoList = res
    .filter((v): v is MapperResultWithPos<T> => typeof v !== "string")
    .map((v) => ({ info: v.attr, gap: v.gap, length: v.text.length } as MappedInfo<T>));
  const replacedText = res.map((v) => (typeof v === "string" ? v : v.text)).join("");
  return { infoList, text: replacedText };
};

const applyMappedInfo = <T, U>(
  text: string,
  mappedInfoList: Readonly<MappedInfo<T>[]>,
  mapper: (text: string, info: T, key: number) => U,
) => {
  const wholeLen = text.length;
  const seek: (str: string, infoList: Readonly<MappedInfo<T>[]>) => (string | U)[] = (
    str: string,
    infoList: Readonly<MappedInfo<T>[]>,
  ) => {
    const [info, ...list] = infoList;
    if (!info) return [];
    const end = info.gap + info.length;
    const prev = str.substring(0, info.gap);
    const next = str.substring(end);
    const item = mapper(str.substring(info.gap, end), info.info, wholeLen + info.gap);
    return [prev, item, ...(list?.length ? seek(next, list) : [next])];
  };
  return seek(text, mappedInfoList).filter((v): v is string | U => v !== "");
};

export { mapText, applyMappedInfo };
export type { TextMapper, ReplaceMap, MapperResultWithPos, MappedInfo, MappedText };
