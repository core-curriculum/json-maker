import { ensureDirSync } from "https://deno.land/std@0.207.0/fs/ensure_dir.ts";
import * as path from "https://deno.land/std@0.207.0/path/posix/mod.ts";

const writeTextFile = (filePath: string, content: string) => {
  const dir = path.dirname(filePath);
  const absoluteDir = path.join(Deno.cwd(), dir);
  ensureDirSync(absoluteDir);
  const fullPath = path.join(absoluteDir, path.basename(filePath));
  Deno.writeTextFileSync(fullPath, content);

}

export { writeTextFile }