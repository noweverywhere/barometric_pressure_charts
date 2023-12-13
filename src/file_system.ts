import { existsSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
// import { writeFile } from 'fs/promises';
import { resolve, extname, join } from 'path';
import * as fsPromise from 'fs/promises';

const projectDir = resolve(__dirname, '..');
export const publicDir = join(projectDir, 'public');
const imagesDir = join(projectDir, 'images');

export const imagePath = (imageName: string) => join(imagesDir, imageName);

export const videoFilePath = join(publicDir, 'video.webm');

[publicDir, imagesDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
});

export const saveImage = async (buffer: Buffer, filename: string): Promise<void> => {
  if (!filename.startsWith(imagesDir)) {
    throw new Error('Files must be saved to images directory');
  }
  return fsPromise.writeFile(filename, buffer)
}

export const imagePaths = (): string[] => {
  return readdirSync(imagesDir)
    .filter(file => extname(file).toLowerCase() === '.gif')
    .map((filePath: string) => { return join(imagesDir, filePath) });
}
