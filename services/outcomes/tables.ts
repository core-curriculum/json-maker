import {
  HeaderedTable,
  mapTable,
  reduceTable,
  toObjectList,
} from "../../libs/tableUtils.ts";
import { MappedText, mapText, MappedInfo } from "../../libs/textMapper.ts";
import { loadTable, loadTableIndex, Tables } from "./loadCsv.ts";
import { Locale } from "../paths.ts";
import { AttrInfo, getReplaceMap } from "./replaceMap.ts";

const fileToTableLink = (file: string) => {
  return `/tables/${file}`;
};

type Expand<T extends Record<string, unknown>> = { [K in keyof T]: T[K] };

const loadTableInfoDict = (locale: Locale) => {
  const trimExt = (filename: string) => filename.replace(/\.[^\.]+$/, "");
  const makeIndexed = <T extends Record<string, unknown>, K extends keyof T>(
    source: T[],
    key: K,
  ): { [key in T[K] extends string ? T[K] : never]: T } => {
    return source.reduce((indexed, item) => {
      return { ...indexed, [item[key] as string]: item };
    }, {} as { [key in T[K] extends string ? T[K] : never]: T });
  };
  const tableIndex = loadTableIndex(locale);
  const infoList = toObjectList(tableIndex).map(info => {
    const file = trimExt(info.file);
    const link = fileToTableLink(file);
    const columns: Record<string, string> = Object.fromEntries(
      info.columns.split(",").map(entry => entry.split(":")),
    );
    return { ...info, file, link, columns };
  });
  return makeIndexed(infoList, "file");
};

const tableInfoDictToIdList = (dict: TableInfoDict) => {
  return Object.entries(dict).map(([, info]) => {
    return [info.id, { type: "tableInfo", ...info } as const] as const;
  });
}


const getTableFiles = (locale: Locale) => {
  return Object.keys(loadTableInfoDict(locale)) as (keyof Tables)[];
};

const getTable = (file: keyof Tables, locale: Locale): TableInfoSet => {
  const tableInfo = loadTableInfoDict(locale)[file];
  const rawTable = loadTable(file, locale);
  const map = getReplaceMap(locale as Locale);
  const attrTable: HeaderedTable<MappedText<AttrInfo>> =
    mapTable<string, MappedText<AttrInfo>>(rawTable, cell =>
      mapText(cell, map),
    );
  const table = mapTable(attrTable, cell => cell.text);
  const attrInfo = reduceTable(
    attrTable,
    (dict, row) => {
      const id = row.id.text;
      const infoLists = Object.entries(row).flatMap(([key, value]) =>
        value.infoList.length > 0 ? [[key, value.infoList] as const] : [],
      );
      const infoDict = Object.fromEntries(infoLists);
      return infoLists.length > 0 ? { ...dict, [id]: infoDict } : dict;
    },
    {} as TableAttrInfo,
  );

  return { table, tableInfo, attrInfo };
};

const getAllTables = (locale: Locale) => {
  const files = getTableFiles(locale);
  const tableList = files
    .map((file) => getTable(file, locale));
  const attrInfo = tableList.reduce((dict, table) => {
    return { ...dict, ...table.attrInfo };
  }, {} as TableAttrInfo);
  const tables = tableList.map(({ table, tableInfo }) => {
    const list = toObjectList(table) as Record<string, unknown>[];
    const content = list.map(({ id, ...row }) => ([id as string, { type: tableInfo.file, ...row }] as const));
    const { id: tableInfoId, ...tableInfoRest } = tableInfo;
    return [[tableInfoId, { type: "tableInfo", ...tableInfoRest }], ...content] as const;
  }).flat().map(row => row[0] in attrInfo ? [row[0], { ...row[1], withAttr: true }] as const : row);
  return { attrInfo, tables };
};

type TableInfoDict = ReturnType<typeof loadTableInfoDict>;
type TableInfo = Expand<TableInfoDict[keyof TableInfoDict]>;
type TableAttrInfo = { [id: string]: { [key: string]: MappedInfo<AttrInfo>[] } };
type TableInfoSet = { table: HeaderedTable<string>; tableInfo: TableInfo; attrInfo: TableAttrInfo };

export { loadTableInfoDict, getTableFiles, getTable, getAllTables, tableInfoDictToIdList };
export type { TableInfo, TableInfoDict, TableAttrInfo, TableInfoSet };
