// lib/carUtils.js
import { packToFs } from 'ipfs-car/pack/fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const s3 = new S3Client({
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'A0868E2870B1D4049F99', 
    secretAccessKey: 'iJSfqWT3w2SgAQ3EFbN0DZsotm4zhLG81vOX3Wif',
  },
});

const bucketName = 'koireng';

export const createCarFile = async (folderPath, outputCarPath) => {
  let log = '';
  try {
    const { root } = await packToFs({
      input: folderPath,
      output: outputCarPath,
      wrapWithDirectory: false,
    });

    log += 'CAR file created successfully.\n';
    log += `Root CID: ${root}\n`;
    return { carFilePath: outputCarPath, rootCID: root, log };
  } catch (error) {
    log += `Error creating CAR file: ${error.message}\n`;
    throw new Error(log);
  }
};

export const uploadCarFile = async (carFilePath) => {
  let log = '';
  try {
    const fileStream = fs.createReadStream(carFilePath);
    const params = {
      Bucket: bucketName,
      Key: path.basename(carFilePath),
      Body: fileStream,
      Metadata: {
        'import': 'car'
      }
    };

    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
   

    log += `ETag for the uploaded CAR file: ${response.ETag}\n`;

    return { log };
  } catch (error) {
    log += 'Error uploading CAR file: ' + error.message + '\n';
    throw new Error(log);
  } finally {
    fs.unlinkSync(carFilePath);
  }
};
