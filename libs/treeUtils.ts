type ShouldFold<T> = (current: T, prev: T, folded: T[], all: T[]) => boolean;

const fold = <T>(arr: T[], shouldFold: ShouldFold<T>) => {
  if (arr.length <= 1) return [arr];
  let folded: T[] = [];
  let prev: null | T = null;
  const result = [];
  for (const item of arr) {
    if (prev !== null && shouldFold(item, prev, folded, arr)) {
      folded.push(item);
    } else {
      folded = [item];
      result.push(folded);
    }
    prev = item;
  }
  return result;
};

type LeafNode<T> = readonly [T];
type BranchNode<T> = readonly [T, Tree<T>];
type TreeNode<T> = BranchNode<T> | LeafNode<T>;
type Tree<T> = readonly TreeNode<T>[];
type TableToTree = <T>(table: T[][], isSameFn?: (u1: T, u2: T) => boolean) => Tree<T>;
const tableToTree: TableToTree = <T>(
  table: T[][],
  isSameFn: (u1: T, u2: T) => boolean = (u1: T, u2: T) => u1 === u2,
) => {
  const processTop: (table: T[][]) => Tree<T> = (table: T[][]) => {
    if (table[0].length > 1) {
      const folded = fold(table, ([currHead], [prevHead]) => isSameFn(currHead, prevHead));
      const grouped = folded.map(
        (unit) => [unit[0][0], processTop(unit.map(([, ...rest]) => rest))] as const,
      );
      return grouped;
    } else {
      return table.map(([head]) => [head]);
    }
  };
  return processTop(table);
};

type TableToTreeMap = <T, R>(
  table: T[][],
  mapFn: (u: T, parents: R[], childTable: T[][]) => R,
  isSameFn?: (u1: T, u2: T) => boolean,
) => Tree<R>;
const tableToTreeMap: TableToTreeMap = <T, R>(
  table: T[][],
  mapFn: (u: T, parents: R[], childTable: T[][]) => R,
  isSameFn: (u1: T, u2: T) => boolean = (u1: T, u2: T) => u1 === u2,
) => {
  const processTop: (table: T[][], parents: R[]) => Tree<R> = (table: T[][], parents: R[] = []) => {
    if (table[0].length > 1) {
      const folded = fold(table, ([currHead], [prevHead]) => isSameFn(currHead, prevHead));
      const grouped = folded.map((unit) => {
        const childTable = unit.map(([, ...rest]) => rest);
        const item = mapFn(unit[0][0], parents, childTable);
        return [item, processTop(childTable, [...parents, item])] as const;
      });
      return grouped;
    } else {
      return table.map(([head]) => [mapFn(head, parents, [])]);
    }
  };
  return processTop(table, []);
};

const treeToList = <T>(tree: Tree<T>) => {
  const list: { parents: T[]; item: T; hasChildren: boolean }[] = [];
  const walkTree = (currTree: Tree<T>, currParents: T[] = []) => {
    currTree.forEach(([item, children]) => {
      const hasChildren = children !== undefined;
      list.push({ item, parents: currParents, hasChildren });
      if (hasChildren) walkTree(children, [...currParents, item]);
    });
  };
  walkTree(tree);
  return list;
};

type TreeReducer<T, R> = (item: T, children: R[], parents: T[]) => R;
const reduceTree = <T, R>(tree: Tree<T>, reducer: TreeReducer<T, R>) => {
  const walkTree = (currTree: Tree<T>, currParents: T[] = []) => {
    return currTree.map(([item, children]) => {
      const hasChildren = children !== undefined;
      const childNodes: R[] = hasChildren ? walkTree(children, [...currParents, item]) : [];
      return reducer(item, childNodes, currParents);
    });
  };
  return walkTree(tree);
};

type TreeSearcher<T> = (item: T, hasChildren: boolean, parents: T[]) => boolean;
const search = <T>(tree: Tree<T>, searcher: TreeSearcher<T>) => {
  const res: T[] = [];
  const walkTree = (currTree: Tree<T>, currParents: T[] = []) => {
    return currTree.forEach(([item, children]) => {
      const hasChildren = children !== undefined;
      if (searcher(item, hasChildren, currParents)) {
        res.push(item);
      }
      if (hasChildren) walkTree(children, [...currParents, item]);
    });
  };
  walkTree(tree);
  return res;
};

type TreeSearchMapper<T, R> = (item: T, hasChildren: boolean, parents: T[]) => R | undefined | null;
const searchMap = <T, R>(tree: Tree<T>, searchMapper: TreeSearchMapper<T, R>) => {
  const res: R[] = [];
  const walkTree = (currTree: Tree<T>, currParents: T[] = []) => {
    return currTree.forEach(([item, children]) => {
      const hasChildren = children !== undefined;
      const mapped = searchMapper(item, hasChildren, currParents);
      if (mapped) {
        res.push(mapped);
      }
      if (hasChildren) walkTree(children, [...currParents, item]);
    });
  };
  walkTree(tree);
  return res;
};

type TreeMapper<T, R> = (item: T, parents: T[], hasChildren: boolean) => R;
const mapTree = <T, R>(tree: Tree<T>, mapper: TreeMapper<T, R>) => {
  const walkTree: (currTree: Tree<T>, currParents?: T[]) => Tree<R> = (
    currTree: Tree<T>,
    currParents: T[] = [],
  ) => {
    return currTree.map(([item, children]) => {
      const hasChildren = children !== undefined;
      const newItem = mapper(item, currParents, hasChildren);
      const newChildren: Tree<R> | undefined = hasChildren
        ? walkTree(children, [...currParents, item])
        : undefined;
      const res: TreeNode<R> = newChildren ? ([newItem, newChildren] as const) : [newItem];
      return res;
    });
  };
  return walkTree(tree);
};

type TreeForEachFn<T> = (item: T, parents: T[], hasChildren: boolean) => void;
const forEachTree = <T, R>(tree: Tree<T>, forEachFn: TreeForEachFn<T>) => {
  const walkTree = (currTree: Tree<T>, currParents: T[] = []) => {
    return currTree.forEach(([item, children]) => {
      const hasChildren = children !== undefined;
      forEachFn(item, currParents, hasChildren);
      if (hasChildren) walkTree(children, [...currParents, item]);
    });
  };
  walkTree(tree);
};

export {
  tableToTree,
  treeToList,
  reduceTree,
  search,
  searchMap,
  forEachTree,
  mapTree,
  tableToTreeMap,
};
export type { Tree };
