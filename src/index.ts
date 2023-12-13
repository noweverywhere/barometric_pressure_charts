import axios from 'axios';
import { existsSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import * as nodeCron from 'node-cron';
import FfmpegCommand from 'fluent-ffmpeg';
import express from "express";
import { resolve, extname, join } from 'path';

const PORT = process.env.PORT || 7667;

const projectDir = resolve(__dirname, '..');
const publicDir = join(projectDir, 'public');
const imagesDir = join(projectDir, 'images');

[publicDir, imagesDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
});

const url = 'https://weather.gc.ca/data/analysis/947_100.gif';
const videoFile = join(publicDir, 'video.webm');

const fetchImage = async (url: string): Promise<Buffer> => {
 const response = await axios.get(url, { responseType: 'arraybuffer' });
 return Buffer.from(response.data, 'binary');
};

const saveImage = (buffer: Buffer, filename: string): void => {
 writeFileSync(filename, buffer);
};

const imageFetchingTask = async (url: string): Promise<void> => {
  const filename = join(imagesDir, `${Date.now()}.gif`);
  await fetchImage(url).then(buffer => saveImage(buffer, filename));
  combineImagesIntoVideo(videoFile);
};

const scheduleImageFetching = (url: string): void => {
 nodeCron.schedule('0 */6 * * *', imageFetchingTask.bind(null, url));
};

const combineImagesIntoVideo = (outputFile: string): void => {
  const command = FfmpegCommand()
   const files = readdirSync(imagesDir).filter(file => extname(file).toLowerCase() === '.gif');
   for (const file of files) {
     command.input(join(imagesDir, file));
   }
   command.outputOptions('-framerate 1/6')
   .output(outputFile)
   .on('end', () => console.log('Video created'))
   .run();
};

const serveApp = (): void => {
 const app = express();
 app.use(express.static(publicDir));
 app.get('/tasks', (_req, res) => {
   const tasks = nodeCron.getTasks();
   res.json(tasks);
 });
 app.get('/fetchImage', async (_req, res) => {
   try {
      await imageFetchingTask(url);
      res.send({ success: true });
   } catch (error) {
      res.send({ success: false, error });
      console.error(error);
   }
  });
 app.listen(PORT, () => {
   console.log('Server started on port', PORT);
 });
};

scheduleImageFetching(url);
serveApp();
debugger
