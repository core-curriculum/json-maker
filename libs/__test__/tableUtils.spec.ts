import {
  dropColumnsByIndexs,
  dropColumnsByNames,
  filterRow,
  get,
  getByKey,
  getIndexColumnValues,
  getNameColumnValues,
  getRowByKey,
  join,
  mapRow,
  reduceTable,
  selectColumnsByIndexs,
  selectColumnsByNames,
  setNameColumnValues,
} from "../tableUtils.ts";
import { expect,test,describe } from "bun:test";

const table1 = [
  ["k1", "k2", "k3", "k4"],
  ["a1", "b1", "c1", "d1"],
  ["a2", "b2", "c2", "d2"],
  ["a3", "b3", "c3", "d3"],
  ["a4", "b4", "c4", "d4"],
  ["a5", "b5", "c5", "d5"],
  ["a6", "b6", "c6", "d6"],
] as const;

const table2 = [
  ["k1", "k2", "k5", "k6"],
  ["a1", "e1", "f1", "f1"],
  ["a3", "e3", "f3", "f3"],
  ["a5", "e5", "f5", "f5"],
  ["a7", "e7", "f7", "f6"],
] as const;

describe("mapRow", () => {
  test("add new row from mapFn", () => {
    const res = mapRow<string, string>(table1, (row) => {
      row["new"] = row["k1"] + row["k4"];
      return row;
    });
    expect(res[0].length).toBe(5);
    expect(res).toEqual([
      ["k1", "k2", "k3", "k4", "new"],
      ["a1", "b1", "c1", "d1", "a1d1"],
      ["a2", "b2", "c2", "d2", "a2d2"],
      ["a3", "b3", "c3", "d3", "a3d3"],
      ["a4", "b4", "c4", "d4", "a4d4"],
      ["a5", "b5", "c5", "d5", "a5d5"],
      ["a6", "b6", "c6", "d6", "a6d6"],
    ]);
  });
  test("delete row from", () => {
    const res = mapRow<string, string>(table1, (row) => {
      delete row.k1;
      return row;
    });
    expect(res[0].length).toBe(3);
    expect(res).toEqual([
      ["k2", "k3", "k4"],
      ["b1", "c1", "d1"],
      ["b2", "c2", "d2"],
      ["b3", "c3", "d3"],
      ["b4", "c4", "d4"],
      ["b5", "c5", "d5"],
      ["b6", "c6", "d6"],
    ]);
  });
});

describe("selectColumnsByIndexs", () => {
  test("selectColumnsByIndexs", () => {
    const res = selectColumnsByIndexs(table1, [0, 2]);
    expect(res[0].length).toBe(2);
    expect(res).toEqual([
      ["k1", "k3"],
      ["a1", "c1"],
      ["a2", "c2"],
      ["a3", "c3"],
      ["a4", "c4"],
      ["a5", "c5"],
      ["a6", "c6"],
    ]);
  });
});

describe("reduceTable", () => {
  test("reduceTable", () => {
    const res = reduceTable(
      table1,
      (accum, row) => {
        accum[row["k1"]] = row;
        return accum;
      },
      {} as Record<string, Record<string, string>>,
    );
    expect(res).toEqual({
      a1: { k1: "a1", k2: "b1", k3: "c1", k4: "d1" },
      a2: { k1: "a2", k2: "b2", k3: "c2", k4: "d2" },
      a3: { k1: "a3", k2: "b3", k3: "c3", k4: "d3" },
      a4: { k1: "a4", k2: "b4", k3: "c4", k4: "d4" },
      a5: { k1: "a5", k2: "b5", k3: "c5", k4: "d5" },
      a6: { k1: "a6", k2: "b6", k3: "c6", k4: "d6" },
    });
  });
});

describe("selectColumnsByNames", () => {
  test("selectColumnsByNames", () => {
    const res = selectColumnsByNames(table1, ["k1", "k3"] as const);
    expect(res[0].length).toBe(2);
    expect(res).toEqual([
      ["k1", "k3"],
      ["a1", "c1"],
      ["a2", "c2"],
      ["a3", "c3"],
      ["a4", "c4"],
      ["a5", "c5"],
      ["a6", "c6"],
    ]);
  });
});

describe("dropColumnsByIndexs", () => {
  test("drop k3", () => {
    const res = dropColumnsByIndexs(table1, [2]);
    expect(res[0].length).toBe(3);
    expect(res).toEqual([
      ["k1", "k2", "k4"],
      ["a1", "b1", "d1"],
      ["a2", "b2", "d2"],
      ["a3", "b3", "d3"],
      ["a4", "b4", "d4"],
      ["a5", "b5", "d5"],
      ["a6", "b6", "d6"],
    ]);
  });
});

describe("dropColumnsByNames", () => {
  test("drop k3", () => {
    const res = dropColumnsByNames(table1, ["k3"]);
    expect(res[0].length).toBe(3);
    expect(res).toEqual([
      ["k1", "k2", "k4"],
      ["a1", "b1", "d1"],
      ["a2", "b2", "d2"],
      ["a3", "b3", "d3"],
      ["a4", "b4", "d4"],
      ["a5", "b5", "d5"],
      ["a6", "b6", "d6"],
    ]);
  });
});

describe("getIndexColumnValues", () => {
  test("gain 2", () => {
    const res = getIndexColumnValues(table1, 2);
    expect(res.length).toBe(6);
    expect(res).toEqual(["c1", "c2", "c3", "c4", "c5", "c6"]);
  });
});

describe("getNameColumnValues", () => {
  test("gain k3", () => {
    const res = getNameColumnValues(table1, "k3");
    expect(res.length).toBe(6);
    expect(res).toEqual(["c1", "c2", "c3", "c4", "c5", "c6"]);
  });
});

describe("setNameColumnValues", () => {
  test("gain k3", () => {
    const res = setNameColumnValues(table1, "k3", [
      "z1",
      "z2",
      "z3",
      "z4",
      "z5",
      "z6",
    ]);
    expect(res.length).toBe(7);
    expect(res).toEqual([
      ["k1", "k2", "k3", "k4"],
      ["a1", "b1", "z1", "d1"],
      ["a2", "b2", "z2", "d2"],
      ["a3", "b3", "z3", "d3"],
      ["a4", "b4", "z4", "d4"],
      ["a5", "b5", "z5", "d5"],
      ["a6", "b6", "z6", "d6"],
    ]);
  });
});

describe("join", () => {
  test("left join(table1 and table2)", () => {
    const res = join(table1, table2, { on: "k1", nan: "nan" });
    expect(res[0].length).toBe(7);
    expect(res).toEqual([
      ["k1", "k2", "k3", "k4", "k2-0", "k5", "k6"],
      ["a1", "b1", "c1", "d1", "e1", "f1", "f1"],
      ["a2", "b2", "c2", "d2", "nan", "nan", "nan"],
      ["a3", "b3", "c3", "d3", "e3", "f3", "f3"],
      ["a4", "b4", "c4", "d4", "nan", "nan", "nan"],
      ["a5", "b5", "c5", "d5", "e5", "f5", "f5"],
      ["a6", "b6", "c6", "d6", "nan", "nan", "nan"],
    ]);
  });

  test("right join(table1 and table2)", () => {
    const res = join(table1, table2, { on: "k1", nan: "nan", how: "right" });
    expect(res[0].length).toBe(7);
    expect(res).toEqual([
      ["k2-0", "k3", "k4", "k1", "k2", "k5", "k6"],
      ["b1", "c1", "d1", "a1", "e1", "f1", "f1"],
      ["b3", "c3", "d3", "a3", "e3", "f3", "f3"],
      ["b5", "c5", "d5", "a5", "e5", "f5", "f5"],
      ["nan", "nan", "nan", "a7", "e7", "f7", "f6"],
    ]);
  });
});

describe("get", () => {
  test("get 2,3 of table1 ", () => {
    const res = get(table1, 2, 3);
    expect(res).toBe("c3");
  });
});

describe("filterRow", () => {
  test("filterRow", () => {
    const res = filterRow(table1, (row) => row["k3"] === "c4");
    expect(res).toEqual([
      ["k1", "k2", "k3", "k4"],
      ["a4", "b4", "c4", "d4"],
    ]);
  });
  test("filterRow filter with values", () => {
    const res = filterRow(table1, (row, values) => values.includes("a4"));
    expect(res).toEqual([
      ["k1", "k2", "k3", "k4"],
      ["a4", "b4", "c4", "d4"],
    ]);
  });
});

const header = [
  "l3_index",
  "l4",
  "l4_index",
  "id",
  "H28ID",
  "l2_index",
  "l3",
  "id-r",
  "l1_index",
  "l2",
  "l2_desc",
  "id-r",
  "l1_spell",
  "l1",
  "l1_desc",
  "id-r",
];

describe("getByKey", () => {
  test("getByKet k2,b3 of table1 ", () => {
    const res = getByKey(table1, "k2", "b3", "k4");
    expect(res).toBe("d3");
  });
});

describe("getRowByKey", () => {
  test("getByRowKey k2,b3 of table1 ", () => {
    const res = getRowByKey(table1, "k2", "b3");
    expect(res).toEqual({ k1: "a3", k2: "b3", k3: "c3", k4: "d3" });
  });
});
