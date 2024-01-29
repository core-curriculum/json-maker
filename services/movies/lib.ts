import { writeTextFile } from "../writeTextFile.ts";
import { loadCsvAsDictList } from "../load-csv-as-dict-list.ts";
import * as cheerio from "cheerio";
import { localeList } from "../locale.ts";
import { urlListToFileInfoDict } from "../../libs/file-utils.ts";

const url = {
  ja: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=0",
  en: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=0",
};

const filesInfoUrl = {
  ja: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=161218406",
  en: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=161218406",
};

const movieInfoUrl = {
  ja: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=1176035837",
  en: "https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=1176035837",
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
            return oEmbedData ? { ...row, id: oEmbedData.id, data: oEmbedData } : null;
          }),
        )
      ).filter(notNull)
    : [];
  return data;
};

const writeUrlSheetToJson = async (url:string,targetPath:string) => {
  const data = await loadCsvAsDictList(url);
  const text = JSON.stringify(data, null, 2);
  writeTextFile(targetPath, text);
  return text;
}
const writeMoviesDataFromGoogleSpreadSheet = async () => {
  const moviesData = localeList.map(async (locale) => {
    const data = await makeDataFromGoogleSpreadSheet(url[locale]);
    const text = JSON.stringify(data, null, 2);
    const filePath = `output/movies/${locale}.json`;
    writeTextFile(filePath, text);
    return text;
  });
  const moviesInfoData = localeList.map(async (locale) => {
    return await writeUrlSheetToJson(movieInfoUrl[locale],`output/movies/${locale}-movie-info.json`);
  });
  const filesInfoData = localeList.map(async (locale) => {
    return await writeUrlSheetToJson(filesInfoUrl[locale],`output/movies/${locale}-files.json`);
  });
  await Promise.all([...moviesData,...filesInfoData,...moviesInfoData]);
};

export { writeMoviesDataFromGoogleSpreadSheet };
