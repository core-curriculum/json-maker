import { expect,test,describe } from "bun:test";
import {dispositionToFilename, googleDriveUrlToDownloadUrl, urlToFileInfo, urlListToFileInfoDict} from '../file-utils';

describe('dispositionToFilename', () => {
  test('should return null when no match', () => {
    expect(dispositionToFilename('')).toBe(null);
  });

  test('should return filename when match', () => {
    expect(dispositionToFilename('attachment; filename="filename.jpg"')).toBe('filename.jpg');
  });

  test('get filename with multiple semicolons', () => {
    expect(dispositionToFilename('attachment; filename="filename.jpg";')).toBe('filename.jpg');
  });


  test("should decode filename with special characters", () => {
    expect(dispositionToFilename('attachment; filename="filename%20with%20space.jpg"; filename*=UTF-8\'\'filename%20with%20space.jpg')).toBe('filename with space.jpg');
  });

  test("prefer encoded filename", () => {
    expect(dispositionToFilename('attachment; filename="filename.jpg"; filename*=UTF-8\'\'filename%20with%20space.jpg')).toBe('filename with space.jpg');
  });

});

describe('googleDriveUrlToDownloadUrl', () => {
  test('should return null when no match', () => {
    expect(googleDriveUrlToDownloadUrl('')).toBe(null);
  });

  test('should return download url when match', () => {
    expect(googleDriveUrlToDownloadUrl('https://drive.google.com/file/d/1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g/view?usp=sharing')).toBe('https://drive.google.com/uc?export=download&id=1AsYYMw94f2CLtVtt6i6nPoBiU5JTKX4g');
  });

});