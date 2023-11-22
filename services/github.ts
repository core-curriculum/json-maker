import { ensureDirSync,copySync,emptyDir } from 'fs-extra';
import { basename, dirname,join } from "path";
import extract from "extract-zip";
import * as os from "os";
import * as fs from "fs"

const downloadFile = async (url: string, path: string) => {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(
      `Error while downloading file from "${url}". (status:${res.status})`,
    );
  }
  const dir = dirname(path);
  ensureDirSync(dir);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(path, buffer);
};

const extractZip = async (path: string, dest: string) => {
  await extract(path,{dir:dest});
};

const makeTempDir = ()=>{
  return fs.mkdtempSync(join(os.tmpdir(), "github_"));
}

/**
 * Extract a github repo to a destination folder
 * @param repoName The name of the repo (e.g. "core-curriculum/data")
 * @param dest The destination folder
 * @returns Promise<void>
 * @example
 * ```ts
 * extractGithubRepo("core-curriculum/data", "./data_in_github");
 * ```
 */
const extractGithubRepo = async (repoName: string, dest: string) => {
  const url = `https://github.com/${repoName}/archive/refs/heads/main.zip`;
  const dir = makeTempDir();
  await downloadFile(url, `${dir}/data.zip`);
  await extractZip(`${dir}/data.zip`, dir);
  copySync(`${dir}/${basename(repoName)}-main`, dest, { overwrite: true });
  await emptyDir(dir);
};

export { extractGithubRepo };
