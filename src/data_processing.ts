import FfmpegCommand from 'fluent-ffmpeg';
import { imagePaths } from './file_system';

export const combineImagesIntoVideo = (outputFile: string): void => {
  const command = FfmpegCommand()
   const files = imagePaths();
   for (const filePath of files) {
     command.input(filePath);
   }
   command.outputOptions('-framerate 1/6')
   .output(outputFile)
   .on('end', () => console.log('Video created'))
   .run();
};
