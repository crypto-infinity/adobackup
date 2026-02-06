require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { cloneRepository, compressFolder } = require('./gitUtils');
const { uploadToBlobStorage } = require('./azureUtils');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

const app = express();
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backup API',
      version: '1.0.0',
      description: 'API per il backup di repository su Azure Blob Storage',
    },
  },
  apis: [__filename],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @openapi
 * /backup:
 *   post:
 *     summary: Esegue il backup di una repository su Azure Blob Storage
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                 type: string
 *                 description: URL della repository da clonare
 *     description: |
 *       Esegue il backup di una repository su Azure Blob Storage.
 *     responses:
 *       200:
 *         description: Backup eseguito con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 blobName:
 *                   type: string
 *       400:
 *         description: Parametri mancanti
 *       500:
 *         description: Errore interno
 */
app.post('/backup', async (req, res) => {
  
  let repoUrl = req.body && req.body.repoUrl;
  if (!repoUrl) {
    repoUrl = 'https://dev.azure.com/datago-demo/dev_tests/_git/dev_tests';
  }

  const pat = process.env.AZURE_DEVOPS_PAT;
  const accessKey = process.env.AZURE_STORAGE_KEY;
  const storageAccount = process.env.AZURE_STORAGE_ACCOUNT || 'adobackup90f5';
  const container = process.env.AZURE_STORAGE_CONTAINER || 'adobackupstorage';
  const username = process.env.AZURE_DEVOPS_USERNAME || 'pat';

  if (!accessKey || !pat || !username) {
    return res.status(400).json({ error: 'Access Key/PAT or username not set.' });
  }

  try {
    console.log("Creating folder...");
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 15);
    const backupFolder = path.join(require('os').tmpdir(), `repo-backup-${timestamp}`);
    fs.mkdirSync(backupFolder, { recursive: true });
    const clonePath = path.join(require('os').tmpdir(), 'repo-clone');
    const zipPath = path.join(backupFolder, 'repo-backup.zip');
    const blobName = `${timestamp}/repo-backup.zip`;

    console.log("Repository cloning...");
    await cloneRepository(repoUrl, clonePath, pat, username);

    console.log("Zipping...");
    await compressFolder(clonePath, zipPath);

    console.log("Uploading to Blob Storage...");
    await uploadToBlobStorage(storageAccount, container, zipPath, blobName, accessKey);

    res.json({ success: true, blobName });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backup API listening on port ${port}`);
});
