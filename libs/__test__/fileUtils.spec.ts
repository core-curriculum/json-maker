import * as fs from "fs";
import * as path from "path";
import { hasBOM, stripBOM, readTextFileSync, rootDir } from "@libs/fileUtis";

const testDataFile = path.resolve(__dirname, "_testData.csv");
const testDataWithBOMFile = path.resolve(__dirname, "_testDataWithBOM.csv");
const testData = `"k1","k2","k3",k4,"k
5"
"a1","a2","a3",a4,"a,5"
"b1","b2","b3",b4,"b5"
"c1","c2","c3",c4,"c5"
"d1","d2","d3",d4,"d5"
"e1","e2","e3",e4,"e5"
"f1","f2","f3",f4,"f5"
`;

describe("BOM utils", () => {
  const dataWithBOM = fs.readFileSync(testDataWithBOMFile);
  const data = fs.readFileSync(testDataFile);
  test("hasBOM", () => {
    expect(hasBOM(dataWithBOM)).toBe(true);
  });
  test("hasBOM -> do not have BOM", () => {
    expect(hasBOM(data)).toBe(false);
  });
  test("stripBOM -> do not have BOM", () => {
    expect(stripBOM(dataWithBOM)).toEqual(data);
  });
});

describe("readTextFileSync", () => {
  const dataWithBOM = readTextFileSync(testDataWithBOMFile);
  const data = readTextFileSync(testDataFile);
  test("dataWithBOM equal testData", () => {
    expect(dataWithBOM).toBe(testData);
  });
  test("dataWithOutBOM equal testData", () => {
    expect(data).toBe(testData);
  });
});

describe("rootDir", () => {
  test("rootDir", () => {
    expect(rootDir).toBeTruthy();
  });
});
