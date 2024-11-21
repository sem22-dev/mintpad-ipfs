// pages/api/uploadFolder.js
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { createCarFile, uploadCarFile } from './carUtils'; // Adjust the import path if necessary

const getNextFolderNumber = () => {
  const baseDir = path.join(process.cwd(), 'assetsfolder');
  let maxNumber = 0;

  const folders = fs.readdirSync(baseDir).filter(file => {
    return fs.statSync(path.join(baseDir, file)).isDirectory();
  });

  folders.forEach(folder => {
    const number = parseInt(folder, 10);
    if (!isNaN(number) && number > maxNumber) {
      maxNumber = number;
    }
  });

  return maxNumber + 1;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.uploadedFolder) {
      req.uploadedFolder = getNextFolderNumber().toString();
    }
    const baseDir = path.join(process.cwd(), 'assetsfolder', req.uploadedFolder);
    const subfolder = file.mimetype.startsWith('image/') ? 'images' : 'metadata';
    const folderPath = path.join(baseDir, subfolder);
    fs.ensureDirSync(folderPath);
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

const updateMetadataFiles = async (metadataFolderPath, rootCID) => {
  try {
    const files = fs.readdirSync(metadataFolderPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(metadataFolderPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const fileName = path.basename(file, '.json');
      const imageExtension = getImageExtension(fileName, path.join(metadataFolderPath, '..', 'images'));
      
      // Update image link with root CID
      data.image = `ipfs://${rootCID}/${fileName}${imageExtension}`;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      // Rename file to remove .json suffix
      const newFilePath = path.join(metadataFolderPath, fileName);
      fs.renameSync(filePath, newFilePath);
      
      console.log(`Updated and renamed ${file} to ${fileName}`);
    }
  } catch (error) {
    console.error('Error updating metadata files:', error);
    throw error;
  }
};


const getImageExtension = (fileName, folderPath) => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4'];
  for (const ext of imageExtensions) {
    if (fs.existsSync(path.join(folderPath, `${fileName}${ext}`))) {
      return ext;
    }
  }
  return '.png'; // Default to .png if no other extension is found
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error uploading files.' });
      }

      const folderNumber = req.uploadedFolder;
      const baseDir = path.join(process.cwd(), 'assetsfolder', folderNumber);

      try {
        const folderPath = path.join(baseDir, 'images');
        const outputCarPath = path.join(baseDir, 'images.car');
        const metadataFolderPath = path.join(baseDir, 'metadata');
        const outputMetadataCarPath = path.join(baseDir, 'metadata.car');

        const { carFilePath: imagesCarPath, rootCID, log: imagesLog } = await createCarFile(folderPath, outputCarPath);
        const { log: uploadImagesLog } = await uploadCarFile(imagesCarPath);

        await updateMetadataFiles(metadataFolderPath, rootCID);
        const { carFilePath: metadataCarPath, log: metadataLog } = await createCarFile(metadataFolderPath, outputMetadataCarPath);
        const { log: uploadMetadataLog } = await uploadCarFile(metadataCarPath);

        fs.rmdirSync(baseDir, { recursive: true });
        
        res.status(200).json({
          message: `Files uploaded and folders processed successfully.`,
          logs: imagesLog + uploadImagesLog + metadataLog + uploadMetadataLog,
        });
      } catch (error) {
        res.status(500).json({ error: 'Error processing folders.', logs: error.message });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}