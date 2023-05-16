import { ensureDirExists } from "mkdir_recursive";
import { basename, dirname } from "path";
import { readZip } from "jszip";
import { copySync } from "fs/copy.ts";
import { emptyDir } from "fs/empty_dir.ts";

const downloadFile = async (url: string, path: string) => {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(
      `Error while downloading file from "${url}". (status:${res.status})`,
    );
  }
  const dir = dirname(path);
  const dirUrl = new URL(dir, import.meta.url);
  await ensureDirExists(dirUrl);
  const file = await Deno.open(path, { write: true, create: true });
  await res.body.pipeTo(file.writable);
};

const extractZip = async (path: string, dest: string) => {
  const zip = await readZip(path);
  await zip.unzip(dest);
};

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
  const dir = await Deno.makeTempDir();
  await downloadFile(url, `${dir}/data.zip`);
  await extractZip(`${dir}/data.zip`, dir);
  copySync(`${dir}/${basename(repoName)}-main`, dest, { overwrite: true });
  await emptyDir(dir);
};

export { extractGithubRepo };
