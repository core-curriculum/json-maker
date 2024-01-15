const dispositionToFilename = (disposition: string): string|null => {
  const matchEncoded = /filename\*=(?:UTF-8|utf-8)''(.*?);? *$/.exec(disposition);
  if (matchEncoded) {
    return decodeURIComponent(matchEncoded[1]);
  }
  const match = /filename="?(.*?)"?;? *$/.exec(disposition);
  if (!match) {
    return null;
  }
  return match[1];
}

const googleDriveUrlToDownloadUrl = (url: string): string|null => {
  const match = /https:\/\/drive.google.com\/(?:file|document)\/d\/(.+)\//.exec(url);
  if (!match) {
    return null;
  }
  return `https://drive.google.com/uc?export=download&id=${match[1]}`;
}


const urlToFileInfo = async (url: string) => {
  const res = await fetch(url);
  if(!res.ok) {
    console.error(res.statusText);
    return null;
  }
  const disposition = res.headers.get('Content-Disposition');
  const fileName = disposition ? dispositionToFilename(disposition) : "";
  const lastModifiedText = res.headers.get('Last-Modified');
  const lastModified = lastModifiedText ? new Date(lastModifiedText).toISOString() : "";
  const result = {
    url,
    fileName,
    lastModified,
  }
  return result;
}

const urlListToFileInfoDict = async (urlList: string[]) => {
  const entries = await Promise.all(urlList.map(async (url) => {
    const downloadUrl = googleDriveUrlToDownloadUrl(url) || url;
    const info = await urlToFileInfo(downloadUrl);
    return [url, info];
  }));
  return Object.fromEntries(entries);
}

export {dispositionToFilename, googleDriveUrlToDownloadUrl, urlToFileInfo, urlListToFileInfoDict};

const urlList = [
  "https://drive.google.com/file/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing",
  "https://drive.google.com/file/d/1WCODBmc3GSVFPK8rx_6gYk07kLiSB9jH/view?usp=sharing",
];

//console.log(await urlListToFileInfoDict(urlList));


  