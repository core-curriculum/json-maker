const fetchCache = new Map<string, Promise<Response>>();
const cachedFetch = async (url: string, options: RequestInit = {}) => {
  if (fetchCache.has(url)) {
    return fetchCache.get(url) as Promise<Response>;
  }
  const promise = fetch(url, options);
  fetchCache.set(url, promise);
  return promise;
};

const dispositionToFilename = (disposition: string): string | null => {
  const matchEncoded = /filename\*=(?:UTF-8|utf-8)''(.*?);? *$/.exec(disposition);
  if (matchEncoded) {
    return decodeURIComponent(matchEncoded[1]);
  }
  const match = /filename="?(.*?)"?;? *$/.exec(disposition);
  if (!match) {
    return null;
  }
  return match[1];
};

const googleDriveUrlToDownloadUrl = (url: string): string | null => {
  const match = /https:\/\/drive.google.com\/(?:file|document)\/d\/(.+)\//.exec(url);
  if (!match) {
    return null;
  }
  return `https://drive.google.com/uc?export=download&id=${match[1]}`;
};

const extractFilename = (url: string): string => {
  const match = /\/([^\/]+\.(?:pdf|docx|pptx|jpg|jpeg|png))$/.exec(url);
  if (!match) {
    return "";
  }
  return match[1];
};

const urlToFileInfo = async (url: string) => {
  try {
    const res = await cachedFetch(url);
    if (!res.ok) {
      console.error(res.statusText);
      return null;
    }
    const disposition = res.headers.get("Content-Disposition") || "";
    const fileName = disposition ? dispositionToFilename(disposition) || extractFilename(url) : "";
    const lastModifiedText = res.headers.get("Last-Modified");
    const lastModified = lastModifiedText ? new Date(lastModifiedText).toISOString() : "";
    const result = {
      url,
      fileName,
      lastModified,
    };
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

type UrlToFileInfoDict = { [url: string]: Awaited<ReturnType<typeof urlToFileInfo>> };

const urlListToFileInfoDict = async (urlList: string[]): Promise<UrlToFileInfoDict> => {
  const entries = await Promise.all(
    urlList.map(async (url) => {
      const downloadUrl = googleDriveUrlToDownloadUrl(url) || url;
      const info = await urlToFileInfo(downloadUrl);
      return [url, info];
    }),
  );
  return Object.fromEntries(entries);
};

export {
  dispositionToFilename,
  googleDriveUrlToDownloadUrl,
  urlToFileInfo,
  urlListToFileInfoDict,
  extractFilename,
};
