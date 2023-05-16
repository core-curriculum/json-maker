type HeaderedTable<T, H extends readonly string[] = string[]> =
  readonly [readonly [...H], ...(readonly (readonly T[])[])];

/**
 * 
 * @param table 
 * @param columnIndexes 
 * @returns 
 */
const selectColumnsByIndexs = <T>(table: HeaderedTable<T>, columnIndexes: number[]) => {
  const [header, ...body] = table;
  return [
    columnIndexes.map((i) => header[i]),
    ...body.map((row) => columnIndexes.map((i) => row[i])),
  ];
};

const selectColumnsByNames = <T, H extends readonly string[] = string[]>(
  table: HeaderedTable<T>, columns: readonly [...H]) => {
  const [header] = table;
  const columnIndexes = columns.map((key) => {
    const index = header.indexOf(key);
    if (index === -1) throw new Error(`Cannot find ${key} in header(${header})`);
    return index;
  });
  return selectColumnsByIndexs(table, columnIndexes) as [[...H], ...T[][]];
};

const dropColumnsByIndexs = <T>(table: HeaderedTable<T>, columnIndexes: number[]) => {
  const [header] = table;
  const indexes = header.filter((_, i) => !columnIndexes.includes(i));
  return selectColumnsByNames(table, indexes);
};

const dropColumnsByNames = <T>(table: HeaderedTable<T>, columns: string[]) => {
  const [header] = table;
  const indexes = header.filter((key) => !columns.includes(key));
  return selectColumnsByNames(table, indexes);
};

const getIndexColumnValues = <T>(table: HeaderedTable<T>, i: number) => {
  const [, ...body] = table;
  return body.map((row) => row[i]);
};

const getNameColumnValues = <T>(table: HeaderedTable<T>, key: string) => {
  const [header] = table;
  const index = header.indexOf(key);
  return getIndexColumnValues(table, index);
};

const dropArray = <T>(arr: ReadonlyArray<T>, start: number, end = 0) =>
  end
    ? [...arr.slice(0, start), ...arr.slice(end + 1)]
    : [...arr.slice(0, start), ...arr.slice(start + 1)];

const joinOptionDefault = {
  how: "left" as "left" | "right",
};
type JoinOption<T> = {
  on: string;
  nan: T;
} & Partial<typeof joinOptionDefault>;
const join = <T, U>(ltable: HeaderedTable<T>, rtable: HeaderedTable<T>, opt: JoinOption<U>) => {
  const { on, nan, how } = { ...joinOptionDefault, ...opt };
  const leftOn = on;
  const rightOn = on;
  const mainKey = how === "left" ? leftOn : rightOn;
  const subKey = how === "left" ? rightOn : leftOn;
  const mainTable = how === "left" ? ltable : rtable;
  const subTable = how === "left" ? rtable : ltable;
  const [mainHeader, ...mainBody] = mainTable;
  const [subHeader, ...subBody] = subTable;

  const mainRef = getNameColumnValues(mainTable, mainKey);
  const subRef = getNameColumnValues(subTable, subKey);

  const refIndexes = mainRef.map((key) => subRef.indexOf(key));

  const subKeyIndex = subHeader.indexOf(subKey);
  const newSubHeader = dropArray(subHeader, subKeyIndex).map((key) => {
    let newKey = key;
    let count = 0;
    while (mainHeader.indexOf(newKey) !== -1) {
      newKey = `${key}-${count++}`;
    }
    return newKey;
  });
  const newHeader =
    how === "left" ? [...mainHeader, ...newSubHeader] : [...newSubHeader, ...mainHeader];

  const subRows = subBody.map((row) => dropArray(row, subKeyIndex));
  const subEmptyRow: U[] = [...Array(subHeader.length - 1)].fill(nan);
  const newBody = mainBody.map((mainRow, i) => {
    const subIndex = refIndexes[i];
    const subRow = subIndex !== -1 ? subRows[subIndex] : subEmptyRow;
    return how === "left" ? [...mainRow, ...subRow] : [...subRow, ...mainRow];
  });
  return [newHeader, ...newBody] as const;
};

const renameColumns = <T>(table: HeaderedTable<T>, dict: Record<string, string>) => {
  const [header, ...body] = table;
  const newHeader = header.map((key) => (key in dict ? dict[key] : key));
  return [newHeader, ...body] as const;
};

const prefixColumns = <T>(table: HeaderedTable<T>, prefix: string) => {
  const [header, ...body] = table;
  const newHeader = header.map((key) => prefix + key);
  return [newHeader, ...body] as const;
};


const replaceArrayValue = <T>(arr: ReadonlyArray<T>, pos: number, value: T) =>
  pos < 0 ? [value, ...arr] : [...arr.slice(0, pos), value, ...arr.slice(pos + 1)];

const setNameColumnValues = <T>(table: HeaderedTable<T> | [[]], name: string, values: T[]) => {
  if (table.length === 0) return [[name], ...values.map((value) => [value])];
  const [header, ...body] = table as HeaderedTable<T>;
  const index = header.indexOf(name) === -1 ? header.length : header.indexOf(name);

  const newHeader = replaceArrayValue(header, index, name);
  const newBody = body.map((row, i) => replaceArrayValue(row, index, values[i]));
  return [newHeader, ...newBody];
};

type MapRowFunc<T, U> = (row: { [key: string]: T }) => { [key: string]: U };
const mapRow = <T, U>(table: HeaderedTable<T>, mapFn: MapRowFunc<T, U>) => {
  const [header, first, ...rest] = table;
  const pairToObj = <V>(a: ReadonlyArray<string>, b: ReadonlyArray<V>) =>
    Object.fromEntries(a.map((v, i) => [v, b[i]]));
  const makeMapRes = (row: ReadonlyArray<T>) => mapFn(pairToObj(header, row));
  const mapResToNewRow = (mapResult: { [key: string]: U }, template: ReadonlyArray<string>) =>
    template.map((key) => mapResult[key]);
  const newKeys = Object.keys(makeMapRes(first));
  const newHeader = [
    ...header.filter((key) => newKeys.includes(key)),
    ...newKeys.filter((key) => !header.includes(key)),
  ];
  const makeNewRow = (row: ReadonlyArray<T>) => mapResToNewRow(makeMapRes(row), newHeader);
  const newFirst = makeNewRow(first);
  const newRest = rest.map(makeNewRow);
  return [newHeader, newFirst, ...newRest] as const;
};

type FilterRowFunc<T> = (row: { [key: string]: T }, values: readonly T[]) => boolean;
const filterRow = <T>(table: HeaderedTable<T>, filterFn: FilterRowFunc<T>) => {
  const [header, ...body] = table;
  const pairToObj = <V>(a: ReadonlyArray<string>, b: ReadonlyArray<V>) =>
    Object.fromEntries(a.map((v, i) => [v, b[i]]));
  const newBody = body.filter((row) => {
    const rowDict = pairToObj(header, row);
    return filterFn(rowDict, row);
  });
  return [header, ...newBody] as const;
};

type ReduceFunc<T, U> = (accum: U, row: { [key: string]: T }) => U;
const reduceTable = <T, U>(table: HeaderedTable<T>, reduceFn: ReduceFunc<T, U>, initValue: U) => {
  const [header, ...body] = table;
  const pairToObj = <V>(a: ReadonlyArray<string>, b: ReadonlyArray<V>) =>
    Object.fromEntries(a.map((v, i) => [v, b[i]]));
  const makeReduceRes = (accum: U, row: ReadonlyArray<T>) =>
    reduceFn(accum, pairToObj(header, row));
  return body.reduce((accum, row) => {
    return makeReduceRes(accum, row);
  }, initValue);
};

const groupBy = <HEADER extends ReadonlyArray<string>, K extends HEADER[number]>(
  table: HeaderedTable<string, HEADER>, key: K
) => {
  const [header, ...body] = table;
  const index = header.indexOf(key);
  if (index === -1) throw new Error(`Cannot find ${key} in table`);
  return body.reduce((dict, row) => {
    const label = row[index] ?? "";
    const prev = label in dict ? dict[label] : [] as string[][]
    return { ...dict, ...{ [label]: [...prev, row] } }
  }, {} as Record<string, (readonly string[])[]>)
}

const toObjectList = <T, HEADER extends readonly string[]>(table: HeaderedTable<T, HEADER>) => {
  const [header, ...body] = table;
  const zipObj = <
    Keys extends readonly string[],
    Values extends readonly unknown[],
  >(keys: Keys, values: Values): {
      [
      K in Exclude<keyof Keys, keyof unknown[]> as K extends keyof Keys
      ? Extract<Keys[K], string>
      : never
      ]: K extends keyof Values ? Values[K] : Values[number];
    } => {
    const zipped = keys.map((key, i) => [key, values[i]]);
    return Object.fromEntries(zipped);
  };

  return body.map((line) => zipObj(header, line))
}

const get = <T>(table: HeaderedTable<T>, colIndex: number, rowIndex: number) =>
  table[rowIndex][colIndex];

const getRowByKey = <T>(table: HeaderedTable<T>, colKey: string, rowKey: T) => {
  const pairToObj = <A>(a1: ReadonlyArray<string>, a2: ReadonlyArray<A>) =>
    Object.fromEntries(a1.map((v, i) => [v, a2[i]]));
  const [header, ...body] = table;
  const colRefIndex = header.indexOf(colKey);
  const rowIndex = table.findIndex((row) => row[colRefIndex] === rowKey);
  return pairToObj(header, body[rowIndex - 1]);
};

const getByKey = <T>(table: HeaderedTable<T>, colKey: string, rowKey: T, targetColKey: string) => {
  const [header] = table;
  const colRefIndex = header.indexOf(colKey);
  const conIndex = header.indexOf(targetColKey);
  const rowIndex = table.findIndex((row) => row[colRefIndex] === rowKey);
  return get(table, conIndex, rowIndex);
};

const mapTable = <T, U, H extends readonly string[] = string[]>(
  table: HeaderedTable<T, H>, mapFn: (cell: T, col: number, row: number) => U
): HeaderedTable<U, H> => {
  const [header, ...body] = table;
  const newBody = body.map((row, r) => row.map((cell, c) => mapFn(cell, c, r)));
  return [[...header], ...newBody];

}

export type { HeaderedTable };

export {
  selectColumnsByIndexs,
  selectColumnsByNames,
  mapRow,
  dropColumnsByIndexs,
  dropColumnsByNames,
  getIndexColumnValues,
  getNameColumnValues,
  join,
  get,
  getByKey,
  getRowByKey,
  groupBy,
  renameColumns,
  setNameColumnValues,
  reduceTable,
  filterRow,
  prefixColumns,
  toObjectList,
  mapTable
};
