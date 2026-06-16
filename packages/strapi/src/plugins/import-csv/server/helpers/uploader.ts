import { first, last } from 'lodash';
import axios from 'axios';
import fs from 'fs';
// import stream from 'stream';
const stream = require('stream');
import path from 'path';
// import { promisify } from 'util';
const promisify = require('util').promisify;

import mime from 'mime-types';

// @todo folder path

export const uploadMedia = async (mediaPath: string, title: string) => {
  const media_url = mediaPath
    .trim()
    .split(' ')[0]
    .replace('//depot-leipzig.de', '//leipzig.depot.social');
  const media_title = last(media_url.split('/')) ?? title.trim();
  const media_alt = title.trim();

  let newMedia;

  if (media_url.indexOf('thumbnail') >= 0 || !media_url) {
    return;
  }

  try {
    newMedia = await uploader.uploadToLibrary(
      media_url,
      media_title,
      media_alt
    );
  } catch (err) {
    console.log('Error uploading media', media_url, media_title, media_alt);
  }

  return newMedia;
};

// @thanks to that one guy on stackoverflow... ;)
const uploader = {
  getFileDetails(filePath) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) reject(err.message);
        resolve(stats);
      });
    });
  },

  deleteFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) reject(err.message);
        resolve('deleted');
      });
    });
  },

  async uploadToLibrary(imageByteStreamURL, imageTitle, imageAlt) {
    const filePath = `./tmp/${imageTitle}`;
    const { data } = await axios.get(imageByteStreamURL, {
      responseType: 'stream',
    });

    const file = fs.createWriteStream(filePath);
    const finished = promisify(stream.finished);
    data.pipe(file);
    await finished(file);
    const image = await this.upload(filePath, 'uploads', imageAlt);
    return image;
  },

  async upload(filePath, saveAs, imageAlt) {
    const stats: any = await this.getFileDetails(filePath);
    const fileName = path.parse(filePath).base;

    const res = await strapi.plugins.upload.services.upload.upload({
      data: { path: saveAs },
      files: {
        // interface PluginUploadFile:
        path: filePath,
        name: fileName,
        type: mime.lookup(filePath),
        size: stats.size,
        alternativeText: imageAlt,
      },
    });

    await this.deleteFile(filePath);
    return first(res);
  },
};
