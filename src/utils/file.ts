import { http, https } from 'follow-redirects';
import { Transform as Stream } from 'stream';
import { clientS3 } from '../clients/s3';

export const downloadFile = (url: any) => new Promise((resolve, reject) => {
  const handler = url.indexOf('https') === -1 ? http : https;
  const req = handler.get(url, (res) => {
    const data = new Stream();
    res.on('data', (chunk) => {
      data.push(chunk);
    });

    res.on('end', () => resolve(data.read()));
    res.on('error', err => {
      reject(err)
      console.log('url error', url)
    });
  });

  req.setTimeout(120000, () => reject(new Error(`Download Timeout ${url}`)));
});

export const uploadFile = async (buffer: any, bucketPath: any, mimeType = 'image/png') => new Promise((resolve, reject) => {
  clientS3.putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: bucketPath,
    Body: buffer,
    ACL: 'public-read',
    ContentType: mimeType,
  }, (err, res) => (err ? reject(err) : resolve(res)));
  console.log('completed  ' + bucketPath)
});

export default {
  downloadFile,
  uploadFile,
};
