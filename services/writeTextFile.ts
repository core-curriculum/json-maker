import * as path from "path";
import { ensureDirSync, outputFileSync as writeTextFileSync } from 'fs-extra';

const writeTextFile = (filePath: string, content: string) => {
  const dir = path.dirname(filePath);
  const absoluteDir = path.join(process.cwd(), dir);
  ensureDirSync(absoluteDir);
  const fullPath = path.join(absoluteDir, path.basename(filePath));
  writeTextFileSync(fullPath, content);

}

export { writeTextFile }