import axios from 'axios';
import { writeFileSync, readdirSync } from 'fs';
import { schedule, getTasks } from 'node-cron';
import * as  FfmpegCommand from 'fluent-ffmpeg';
import * as express from 'express';
import { resolve, extname } from 'path';

const PORT = process.env.PORT || 7667;

const publicDir = resolve(__dirname, 'public');
const url = 'https://weather.gc.ca/data/analysis/947_100.gif';
const videoFile = './public/video.webm';

const fetchImage = async (url: string): Promise<Buffer> => {
 const response = await axios.get(url, { responseType: 'arraybuffer' });
 return Buffer.from(response.data, 'binary');
};

const saveImage = (buffer: Buffer, filename: string): void => {
 writeFileSync(filename, buffer);
};

const scheduleImageFetching = (url: string): void => {
 schedule('0 */6 * * *', async () => {
   const filename = `./public/${Date.now()}.gif`;
   await fetchImage(url).then(buffer => saveImage(buffer, filename));
   combineImagesIntoVideo(videoFile);
 });
};

const combineImagesIntoVideo = (outputFile: string): void => {
  const command = FfmpegCommand()
   const files = readdirSync(publicDir).filter(file => extname(file).toLowerCase() === '.gif');
   for (const file of files) {
     command.input(`public/${file}`);
   }
   command.outputOptions('-framerate 1/6')
   .output(outputFile)
   .on('end', () => console.log('Video created'))
   .run();
};

const serveApp = (): void => {
 const app = express();
 app.use(express.static('public'));
 app.get('/tasks', (_req, res) => {
   const tasks = getTasks();
   res.json(tasks);
 });
 app.listen(PORT, () => {
   console.log('Server started on port', PORT);
 });
};

scheduleImageFetching(url);
serveApp();
