import { fmt } from "@libs/utils";

test("utils.fmt", () => {
  const template = '"{text}"を{clip}にコピーしました'
  const res = fmt(template, { text: "text example", clip: "クリップボード" });
  expect(res).toBe('"text example"をクリップボードにコピーしました')

})