import { writeTextFile } from "../writeTextFile.ts";
import {
  DOMParser,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { loadCsvAsDictList } from "../load-csv-as-dict-list.ts";


const url = `https://docs.google.com/spreadsheets/d/1MNa7Zh2h5vGnSYUHU3vFjWPN4GveYsF_xXZnC0wXUOI/export?format=csv&gid=0`;

const extractPlayerUrl = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html")!;
  const iframe = doc.querySelector("iframe");
  if (!iframe) return "";
  const url = iframe.getAttribute("src");
  return url;
}


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
};
const getOEmbedData = async (movieUrl: string) => {
  const base = `https://vimeo.com/api/oembed.json`;
  const params = new URLSearchParams({
    url: movieUrl,
    autoplay: "true",
    responsive: "true",
  });
  const url = `${base}?${params.toString()}`;
  const res = await fetch(url).then(res => res.json());
  if (!res) return null;
  const player_url = extractPlayerUrl(res.html);
  return { ...res, player_url } as MovieData;
};

const makeDataFromGoogleSpreadSheet = async (url: string) => {
  const notNull = (x: unknown): x is NonNullable<typeof x> => x !== null && x !== undefined;
  const table = await loadCsvAsDictList(url);
  const data = table
    ? ((
      await Promise.all(
        table.map(async row => {
          const movieUrl = row["url"];
          const oEmbedData = await getOEmbedData(movieUrl);
          return oEmbedData ? oEmbedData : null;
        }),
      )
    ).filter(notNull) as MovieData[])
    : [];
  return data;
};

const writeMoviesDataFromGoogleSpreadSheet = async () => {
  const data = await makeDataFromGoogleSpreadSheet(url);
  const text = JSON.stringify(data, null, 2);
  const filePath = "output/movies.json";
  writeTextFile(filePath, text);
  return text;
}

export { writeMoviesDataFromGoogleSpreadSheet }
