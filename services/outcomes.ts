import {
  HeaderedTable,
  prefixColumns,
  join,
  selectColumnsByNames,
  renameColumns,
  mapRow,
} from "../libs/tableUtils.ts";
import { MappedInfo, mapText } from "../libs/textMapper.ts";
import { mapTree, tableToTree, treeToList } from "../libs/treeUtils.ts";
import type { Tree } from "../libs/treeUtils.ts";
import { loadOutcomes } from "./loadCsv.ts";
import type { TableInfoDict } from "./tables.ts";
import { Locale } from "./paths.ts";
import { AttrInfo, getReplaceMap } from "./replaceMap.ts";

const loadFullOutcomesTable = (locale: Locale) => {
  const header = [
    "l1_item",
    "l2_item",
    "l3_item",
    "l4_item",
    "l1_id",
    "l2_id",
    "l3_id",
    "l4_id",
    "l1_index",
    "l2_index",
    "l3_index",
    "l4_index",
    "l1_description",
    "l2_description",
    "l1_spell",
  ] as const;
  const renameDict = {
    l2_parent: "l1_id",
    l3_parent: "l2_id",
    l4_parent: "l3_id",
  };
  const [l1, l2, l3, l4] = (["1", "2", "3", "4"] as const).map(layer => {
    const raw = loadOutcomes(layer, locale);
    const data = prefixColumns(raw, `l${layer}_`);
    return renameColumns(data, renameDict);
  });
  const l12 = join(l1, l2, { on: "l1_id", nan: "", how: "right" });
  const l123 = join(l12, l3, { on: "l2_id", nan: "", how: "right" });
  const l1234 = join(l123, l4, { on: "l3_id", nan: "", how: "right" });
  return selectColumnsByNames(l1234, header);
};

type OutcomeBasicInfo = {
  text: string;
  id: string;
  index: string;
};
type Outcomel1 = {
  type: "l1";
  desc: string;
  spell: string;
} & OutcomeBasicInfo;
type Outcomel2 = {
  type: "l2";
  desc: string;
} & OutcomeBasicInfo;
type Outcomel3 = {
  type: "l3";
  withAttr?: boolean;
} & OutcomeBasicInfo;
type Outcomel4 = {
  type: "l4";
  withAttr?: boolean;
} & OutcomeBasicInfo;
type OutcomeInfo = Outcomel4 | Outcomel3 | Outcomel2 | Outcomel1;
type OutcomeRow = {
  l1: Outcomel1;
  l2: Outcomel2;
  l3: Outcomel3;
  l4: Outcomel4;
};

const makeMappedOutcomesTable = (
  fullOutcomesTable: HeaderedTable<string>,
  infoDict: TableInfoDict,
  locale: Locale,
) => {
  const map = getReplaceMap(locale, infoDict);
  const infoList:Record<string,{[key:string]:MappedInfo<AttrInfo>[]}> = {};

  const rows = mapRow(fullOutcomesTable, row => {
    const { text: l4text, infoList: l4AttrInfo } = mapText(row["l4_item"], map);
    const { text: l3text, infoList: l3AttrInfo } = mapText(row["l3_item"], map);
    const newRow: OutcomeRow = {
      l1: {
        type: "l1",
        text: row["l1_item"],
        id: row["l1_id"],
        desc: row["l1_description"],
        index: row["l1_index"],
        spell: row["l1_spell"],
      },
      l2: {
        type: "l2",
        text: row["l2_item"],
        id: row["l2_id"],
        desc: row["l2_description"],
        index: row["l2_index"],
      },
      l3: {
        type: "l3",
        text: l3text,
        id: row["l3_id"],
        index: row["l3_index"],
      },
      l4: {
        type: "l4",
        text: l4text,
        id: row["l4_id"],
        index: row["l4_index"],
      },
    };
    if (l4AttrInfo?.length > 0) {
      infoList[newRow.l4.id]  = {item:l4AttrInfo};
      newRow.l4.withAttr = true;
    }
    if (l3AttrInfo?.length > 0){
      infoList[newRow.l3.id]  = {item:l3AttrInfo};
      newRow.l3.withAttr = true;
    }
    return newRow;
  });
  return {infoList,rows};
};

const makeOutcomesTree = (
  fullOutcomesTable: HeaderedTable<string>,
  infoDict: TableInfoDict,
  locale: Locale,
) => {
  const {infoList:attrInfo,rows:[, ...table]} = makeMappedOutcomesTable(fullOutcomesTable, infoDict, locale);
  const tree = tableToTree(table, (u1, u2) => u1.id === u2.id) as Tree<OutcomeInfo>;
  const idTree = mapTree(tree, node => node.id);
  const outcomeList = treeToList(tree).map(row => ([row.item.id,{...row.item,}]));
  return {attrInfo,idTree,outcomeList}
};

export { loadFullOutcomesTable, makeMappedOutcomesTable, makeOutcomesTree };
export type { Outcomel1, Outcomel2, Outcomel3, Outcomel4, OutcomeInfo };
