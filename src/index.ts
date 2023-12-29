import axios from 'axios';
import * as nodeCron from 'node-cron';
import express from "express";
import { saveImage as saveImageToFile, imagePath, videoFilePath, publicDir } from './file_system';
import { combineImagesIntoVideo } from './data_processing';

const PORT = process.env.PORT || 7667;

const urls = [
  'https://weather.gc.ca/data/analysis/947_100.gif',
  'https://weather.gc.ca/data/analysis/951_100.gif',
  'https://weather.gc.ca/data/analysis/935_100.gif',
  'https://weather.gc.ca/data/analysis/941_100.gif',
];

const fetchImage = async (url: string): Promise<Buffer> => {
 const response = await axios.get(url, { responseType: 'arraybuffer' });
 return Buffer.from(response.data, 'binary');
};

const saveImage = async (buffer: Buffer, filename: string): Promise<void> => {
  saveImageToFile(buffer, filename)
};

const fetchImages = async (urls: string[]): Promise<Buffer[]> => {
  const promises = urls.map(fetchImage);
  return Promise.all(promises);
};

const imageFetchingTask = async (urls: string[]): Promise<void> => {
  const buffers = await fetchImages(urls);
  const filenames = buffers.map((_, index) => imagePath(`${Date.now()}_${index}.gif`));
  await Promise.all(buffers.map((buffer, index) => saveImage(buffer, filenames[index])));
  try {
    combineImagesIntoVideo(videoFilePath);
  } catch (error) {
    console.error(error);
  }
};

const scheduleImageFetching = (urls: string[]): void => {
 nodeCron.schedule('0 */6 * * *', imageFetchingTask.bind(null, urls));
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
      await imageFetchingTask(urls);
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

scheduleImageFetching(urls);
serveApp();
