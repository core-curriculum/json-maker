import { makeSchema, validate } from "@libs/schema";

test("makeSchema", () => {
  const act = makeSchema(unit => {
    unit("name", "text");
    unit("place", "text", { default: "university", rules: ["required"] });
  });
  expect(act).toEqual([
    { key: "name", rules: [], type: "text" },
    {
      default: "university",
      key: "place",
      rules: ["required"],
      type: "text",
    },
  ]);
});

test("validate", () => {
  const schema = makeSchema(unit => {
    unit("name", "text");
    unit("place", "text", { default: "university", rules: ["required"] });
  });
  const values = { name: "panda" };
  const act = validate(values, schema);
  expect(act).toEqual({ errors: [{ key: "place", rules: ["required"] }], ok: false });
});
