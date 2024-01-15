import { writeTextFile } from "../writeTextFile.ts";
import { loadCsvAsDictList } from "../load-csv-as-dict-list.ts";
import * as cheerio from "cheerio";
import { localeList } from "../locale.ts";
import { urlListToFileInfoDict } from "../../libs/file-utils.ts";

const url = {
  ja: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=0",
  en: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=0",
};

const extractPlayerUrl = (html: string) => {
  const $ = cheerio.load(html);
  const iframe = $("iframe");
  if (!iframe) return "";
  const url = iframe.attr("src");
  return url;
};

type MovieData = {
  title: string;
  video_url: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  thumbnail_url_with_play_button: string;
  player_url: string;
  upload_date: string;
  uri: string;
  id: string;
};
const getOEmbedData = async (movieUrl: string) => {
  const base = "https://vimeo.com/api/oembed.json";
  const params = new URLSearchParams({
    url: movieUrl,
    autoplay: "true",
    responsive: "true",
  });
  const url = `${base}?${params.toString()}`;
  try {
    const res = (await fetch(url).then((res) => res.json())) as Record<string, string>;
    if (!res) return null;
    const player_url = extractPlayerUrl(res.html);
    const id = res.video_id.toString();
    return { ...res, player_url, id } as MovieData;
  } catch (e) {
    console.error(`url:${movieUrl}, message:${e}`);
    return null;
  }
};

type InfoListWithFiles = {
  files: string[];
}[];

const convertFilesToFilesInfo = async <T extends InfoListWithFiles>(infoList: T) => {
  const allFiles = infoList.flatMap((info) => info.files);
  const filesInfoDict = await urlListToFileInfoDict(allFiles);
  const result = infoList.map((info) => {
    const filesInfo = info.files.map((url) => filesInfoDict[url] || { url });
    return { ...info, filesInfo };
  });
  return result;
};

const makeDataFromGoogleSpreadSheet = async (url: string) => {
  const notNull = <T>(x: T): x is NonNullable<T> => x !== null && x !== undefined;
  const table = await loadCsvAsDictList(url);
  const data = table
    ? (
        await Promise.all(
          table.map(async (row) => {
            const movieUrl = row.url;
            const oEmbedData = await getOEmbedData(movieUrl);
            const files = row.files ? row.files.split(",").map((s) => s.trim()) : [];
            return oEmbedData ? { ...row, files, id: oEmbedData.id, data: oEmbedData } : null;
          }),
        )
      ).filter(notNull)
    : [];
  return await convertFilesToFilesInfo(data);
};

const writeMoviesDataFromGoogleSpreadSheet = async () => {
  await Promise.all(
    localeList.map(async (locale) => {
      const data = await makeDataFromGoogleSpreadSheet(url[locale]);
      const text = JSON.stringify(data, null, 2);
      const filePath = `output/movies/${locale}.json`;
      writeTextFile(filePath, text);
      return text;
    }),
  );
};

export { writeMoviesDataFromGoogleSpreadSheet };
