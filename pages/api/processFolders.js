import path from 'path';
import fs from 'fs-extra';
import { createCarFile, uploadCarFile } from '../api/carUtils';
import pLimit from 'p-limit';

const baseDir = path.join(process.cwd(), 'assetsfolder');
const limit = pLimit(10); // Limit concurrency to 10 to avoid memory issues

const getImageExtension = (fileName, folderPath) => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4'];
  for (const ext of imageExtensions) {
    if (fs.existsSync(path.join(folderPath, `${fileName}${ext}`))) {
      return ext;
    }
  }
  return '.png';
};

const updateMetadataFiles = async (metadataFolderPath, rootCID) => {
  try {
    const files = fs.readdirSync(metadataFolderPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(metadataFolderPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const fileName = path.basename(file, '.json');
      const imageExtension = getImageExtension(fileName, path.join(metadataFolderPath, '..', 'images'));
      data.image = `ipfs://${rootCID}/${fileName}${imageExtension}`;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Updated ${file} with new image URL.`);
    }
  } catch (error) {
    console.error('Error updating metadata files:', error);
  }
};

const processFolder = async (folderName) => {
  const folderPath = path.join(baseDir, folderName, 'images');
  const outputCarPath = path.join(process.cwd(), 'test-output-images');
  const metadataFolderPath = path.join(baseDir, folderName, 'metadata');
  const outputMetadataCarPath = path.join(process.cwd(), 'test-output-metadata');

  try {
    const { carFilePath, rootCID } = await createCarFile(folderPath, outputCarPath);
    console.log(`Root CID for images in folder ${folderName}: ${rootCID}`);
    await uploadCarFile(carFilePath);
    await updateMetadataFiles(metadataFolderPath, rootCID);
    const { carFilePath: metadataCarFilePath } = await createCarFile(metadataFolderPath, outputMetadataCarPath);
    console.log(`Metadata CAR file created at: ${metadataCarFilePath}`);
    await uploadCarFile(metadataCarFilePath);

    // Optionally delete the processed folder
    await fs.remove(path.join(baseDir, folderName));
    console.log(`Deleted folder ${folderName}`);

  } catch (error) {
    console.error(`Error processing folder ${folderName}:`, error);
  }
};

const processAllFolders = async () => {
  try {
    const folders = fs.readdirSync(baseDir).filter(file => {
      return fs.statSync(path.join(baseDir, file)).isDirectory() && !isNaN(parseInt(file, 10));
    });

    // Process each folder with controlled concurrency
    await Promise.all(
      folders.map(folder => limit(() => processFolder(folder)))
    );

  } catch (error) {
    console.error('Error processing folders:', error);
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await processAllFolders();
      res.status(200).json({ message: 'Folders processed successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Error processing folders.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
