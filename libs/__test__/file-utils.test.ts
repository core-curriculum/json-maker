import { expect, test, describe } from "bun:test";
import {
  dispositionToFilename,
  googleDriveUrlToDownloadUrl,
  extractFilename,
  urlToFileInfo,
  urlListToFileInfoDict,
} from "../file-utils";

describe("dispositionToFilename", () => {
  test("should return null when no match", () => {
    expect(dispositionToFilename("")).toBe(null);
  });

  test("should return filename when match", () => {
    expect(dispositionToFilename('attachment; filename="filename.jpg"')).toBe("filename.jpg");
  });

  test("get filename with multiple semicolons", () => {
    expect(dispositionToFilename('attachment; filename="filename.jpg";')).toBe("filename.jpg");
  });

  test("should decode filename with special characters", () => {
    expect(
      dispositionToFilename(
        "attachment; filename=\"filename%20with%20space.jpg\"; filename*=UTF-8''filename%20with%20space.jpg",
      ),
    ).toBe("filename with space.jpg");
  });

  test("prefer encoded filename", () => {
    expect(
      dispositionToFilename(
        "attachment; filename=\"filename.jpg\"; filename*=UTF-8''filename%20with%20space.jpg",
      ),
    ).toBe("filename with space.jpg");
  });
});

describe("googleDriveUrlToDownloadUrl", () => {
  test("should return null when no match", () => {
    expect(googleDriveUrlToDownloadUrl("")).toBe(null);
  });

  test("should return download url when match", () => {
    expect(
      googleDriveUrlToDownloadUrl(
        "https://drive.google.com/file/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing",
      ),
    ).toBe("https://drive.google.com/uc?export=download&id=1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g");
    expect(
      googleDriveUrlToDownloadUrl(
        "https://drive.google.com/document/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing",
      ),
    ).toBe("https://drive.google.com/uc?export=download&id=1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g");
  });
});

describe("extractFilename", () => {
  test("should return empty string when no match", () => {
    expect(extractFilename("")).toBe("");
  });

  test("should return empty filename when not match pattern", () => {
    expect(
      extractFilename(
        "https://drive.google.com/file/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing",
      ),
    ).toBe("");
  });

  test("should return filename when match pattern", () => {
    expect(extractFilename("https://example.com/filename.jpg")).toBe("filename.jpg");
    expect(extractFilename("https://example.com/filename.pdf")).toBe("filename.pdf");
  });
});

describe("urlToFileInfo", () => {
  test("should return null when fetch failed", async () => {
    const url = "https://example.example";
    const res = await urlToFileInfo(url);
    expect(res).toBe(null);
  });

  test("should return file info when fetch success", async () => {
    const url = "https://drive.google.com/uc?export=download&id=1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g";
    const res = await urlToFileInfo(url);
    expect(res?.fileName).toEqual("outcomes.docx");
  });
});

describe("urlListToFileInfoDict", () => {
  test("should return empty object when urlList is empty", async () => {
    const urlList: string[] = [];
    const res = await urlListToFileInfoDict(urlList);
    expect(res).toEqual({});
  });

  test("should return file info dict when urlList is not empty", async () => {
    const urlList = [
      "https://drive.google.com/file/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing",
      "https://drive.google.com/file/d/1WCODBmc3GSVFPK8rx_6gYk07kLiSB9jH/view?usp=sharing",
    ];
    const res = await urlListToFileInfoDict(urlList);
    const lastModifiedDates = Object.values(res).map((info) => info?.lastModified);
    expect(lastModifiedDates).toEqual(["2022-11-28T04:25:04.000Z", "2022-11-28T04:20:31.000Z"]);
    expect(res).toEqual({
      "https://drive.google.com/file/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing": {
        fileName: "outcomes.docx",
        lastModified: "2022-11-28T04:25:04.000Z",
        url: "https://drive.google.com/uc?export=download&id=1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g",
      },
      "https://drive.google.com/file/d/1WCODBmc3GSVFPK8rx_6gYk07kLiSB9jH/view?usp=sharing": {
        fileName: "outcomes.pdf",
        lastModified: "2022-11-28T04:20:31.000Z",
        url: "https://drive.google.com/uc?export=download&id=1WCODBmc3GSVFPK8rx_6gYk07kLiSB9jH",
      },
    });
  });
});
