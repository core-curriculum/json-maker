import { toBase64, toUUID } from "@libs/uuid_translator";

test("toBase64", () => {
  const src = "a44521d0-0fb8-4ade-8002-3385545c3318"
  const res = toBase64(src);
  expect(res).toBe('pEUh0A-4St6AAjOFVFwzGA')

})

test("toUUID", () => {
  const src = "pEUh0A-4St6AAjOFVFwzGA"
  const res = toUUID(src);
  expect(res).toBe("a44521d0-0fb8-4ade-8002-3385545c3318")

})
