import {
  tableToTree,
  treeToList,
  reduceTree,
  search,
  searchMap,
  tableToTreeMap,
} from "@libs/treeUtils";

const testTable = [
  ["a1", "b1", "c1", "d1"],
  ["a1", "b2", "c1", "d1"],
  ["a2", "b2", "c1", "d1"],
  ["a3", "b2", "c1", "d1"],
  ["a3", "b2", "c1", "d2"],
  ["a3", "b4", "c1", "d2"],
];

const testTree = [
  [
    "a1",
    [
      ["b1", [["c1", [["d1"]]]]],
      ["b2", [["c1", [["d1"]]]]],
    ],
  ],
  ["a2", [["b2", [["c1", [["d1"]]]]]]],
  [
    "a3",
    [
      ["b2", [["c1", [["d1"], ["d2"]]]]],
      ["b4", [["c1", [["d2"]]]]],
    ],
  ],
] as const;

const testTree2 = [
  [
    "a1(2) in []",
    [
      ["b1(1) in [a1]", [["c1(1) in [a1/b1]", [["d1"]]]]],
      ["b2(1) in [a1]", [["c1(1) in [a1/b2]", [["d1"]]]]],
    ],
  ],
  ["a2(1) in []", [["b2(1) in [a2]", [["c1(1) in [a2/b2]", [["d1"]]]]]]],
  [
    "a3(3) in []",
    [
      ["b2(2) in [a3]", [["c1(2) in [a3/b2]", [["d1"], ["d2"]]]]],
      ["b4(1) in [a3]", [["c1(1) in [a3/b4]", [["d2"]]]]],
    ],
  ],
] as const;

const listFromTree = [
  { item: "a1", parents: [], hasChildren: true },
  { item: "b1", parents: ["a1"], hasChildren: true },
  { item: "c1", parents: ["a1", "b1"], hasChildren: true },
  { item: "d1", parents: ["a1", "b1", "c1"], hasChildren: false },
  { item: "b2", parents: ["a1"], hasChildren: true },
  { item: "c1", parents: ["a1", "b2"], hasChildren: true },
  { item: "d1", parents: ["a1", "b2", "c1"], hasChildren: false },
  { item: "a2", parents: [], hasChildren: true },
  { item: "b2", parents: ["a2"], hasChildren: true },
  { item: "c1", parents: ["a2", "b2"], hasChildren: true },
  { item: "d1", parents: ["a2", "b2", "c1"], hasChildren: false },
  { item: "a3", parents: [], hasChildren: true },
  { item: "b2", parents: ["a3"], hasChildren: true },
  { item: "c1", parents: ["a3", "b2"], hasChildren: true },
  { item: "d1", parents: ["a3", "b2", "c1"], hasChildren: false },
  { item: "d2", parents: ["a3", "b2", "c1"], hasChildren: false },
  { item: "b4", parents: ["a3"], hasChildren: true },
  { item: "c1", parents: ["a3", "b4"], hasChildren: true },
  { item: "d2", parents: ["a3", "b4", "c1"], hasChildren: false },
];

const treeText = `
a1    parents:[]
  b1    parents:[a1]
    c1    parents:[a1,b1]
      d1    parents:[a1,b1,c1]
  b2    parents:[a1]
    c1    parents:[a1,b2]
      d1    parents:[a1,b2,c1]
a2    parents:[]
  b2    parents:[a2]
    c1    parents:[a2,b2]
      d1    parents:[a2,b2,c1]
a3    parents:[]
  b2    parents:[a3]
    c1    parents:[a3,b2]
      d1    parents:[a3,b2,c1]
      d2    parents:[a3,b2,c1]
  b4    parents:[a3]
    c1    parents:[a3,b4]
      d2    parents:[a3,b4,c1]`;

describe("tableToTree", () => {
  test("testTable", () => {
    const res = tableToTree(testTable);
    expect(res).toEqual(testTree);
  });
});

describe("tableToTreeMap", () => {
  test("testTableMap", () => {
    const res = tableToTreeMap<string, string>(testTable, (item, parents, childTable) => {
      if (childTable.length === 0) return item;
      return `${item}(${childTable.length}) in [${parents
        .map((text) => text[0] + text[1])
        .join("/")}]`;
    });
    expect(res).toEqual(testTree2);
  });
});

describe("treeToList", () => {
  test("treeToList", () => {
    const res = treeToList<string>(testTree);
    expect(res).toEqual(listFromTree);
  });
});

const indent = (text: string, space: string) =>
  text
    .split("\n")
    .map((line) => space + line)
    .join("\n");
describe("reduceTree", () => {
  test("reduceTree", () => {
    const res = reduceTree<string, string>(testTree, (item, children, parents) => {
      const head = item + `    parents:[${parents.join(",")}]`;
      const tail = indent(children.join(`\n`), "  ");
      return children.length > 0 ? head + "\n" + tail : head;
    }).join("\n");
    expect("\n" + res).toEqual(treeText);
  });
});

describe("search(Tree)", () => {
  test("search", () => {
    const res = search<string>(testTree, (item, hasChildren, parents) => {
      return item === "d1";
    });
    expect(res).toEqual(["d1", "d1", "d1", "d1"]);
  });
});

describe("searchMap(Tree)", () => {
  test("searchMap", () => {
    const res = searchMap<string, string>(testTree, (item, hasChildren, parents) => {
      if (item === "d1") return `${item}-(${parents.join(",")})`;
    });
    expect(res).toEqual(["d1-(a1,b1,c1)", "d1-(a1,b2,c1)", "d1-(a2,b2,c1)", "d1-(a3,b2,c1)"]);
  });
});
