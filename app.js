require('dotenv').config();

const fs = require('fs');
const path = require('path');

const express = require('express');
const { cloneRepository, compressFolder } = require('./gitUtils');
const { uploadToBlobStorage } = require('./azureUtils');
const { getJwtAuthMiddleware } = require('./jwtUtils');

const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swaggerSetup')

/**
 * EXPRESS
 */

const app = express();

app.use(express.json());
app.use('/backup', getJwtAuthMiddleware());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * ROTTE
 */


/**
 * @openapi
 * /backup:
 *   post:
 *     summary: Esegue il backup di una repository su Azure Blob Storage
 *     description: |
 *       Esegue il backup di una repository su Azure Blob Storage. Richiede autenticazione tramite Bearer JWT (OAuth2, Entra ID).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                 type: string
 *                 description: URL della repository da clonare
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
 *         description: Parametri mancanti o credenziali non valide
 *       401:
 *         description: Autenticazione mancante o token non valido
 *       500:
 *         description: Errore interno
 */
app.post('/backup', async (req, res) => {
  let repoUrl = req.body && req.body.repoUrl;
  if (!repoUrl) {
    return res.status(400).json({ error: "repoUrl not set!" });
  }

  const pat = process.env.AZURE_DEVOPS_PAT;
  const accessKey = process.env.AZURE_STORAGE_KEY;
  const storageAccount = process.env.AZURE_STORAGE_ACCOUNT || 'adobackup90f5';
  const container = process.env.AZURE_STORAGE_CONTAINER || 'adobackupstorage';
  const username = process.env.AZURE_DEVOPS_USERNAME || 'pat';

  if (!accessKey || !pat) {
    return res.status(400).json({ error: 'Access Key/PAT not set.' });
  }

  try {
    console.log("Creating folder...");

    // Massimo una folder all'ora (YYYYMMDDHH)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hour}`;

    const backupFolder = path.join(require('os').tmpdir(), `repo-backup-${timestamp}`);
    fs.mkdirSync(backupFolder, { recursive: true });
    const clonePath = path.join(require('os').tmpdir(), 'repo-clone');

    // Estrai il nome repo dalla URL (valido per Azure DevOps e GitHub, anche senza .git)
    let repoName = 'repo';
    try {
      // Link validi:
      // https://dev.azure.com/org/_git/reponame
      // https://github.com/org/reponame.git
      // https://github.com/org/reponame
      const urlParts = repoUrl.split('/');
      // Azure DevOps: cerca dopo '_git/'
      const gitIndex = urlParts.indexOf('_git');
      if (gitIndex !== -1 && urlParts.length > gitIndex + 1) {
        repoName = urlParts[gitIndex + 1];
      } else {
        // GitHub: ultimo segmento, rimuovi .git se presente
        repoName = urlParts[urlParts.length - 1].replace(/\.git$/, '');
      }
      // Fallback se vuoto
      if (!repoName) repoName = 'repo';
    } catch (e) {
      repoName = 'repo';
    }
    const zipFileName = `${repoName}.zip`;
    const zipPath = path.join(backupFolder, zipFileName);
    const blobName = `${timestamp}/${zipFileName}`;

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

/**
 * @openapi
 * /swagger.json:
 *   get:
 *     summary: Ottieni la specifica OpenAPI/Swagger dell'API
 *     description: Restituisce il documento OpenAPI (swagger.json) per questa API.
 *     tags:
 *       - Documentazione
 *     responses:
 *       200:
 *         description: Documento OpenAPI restituito con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Errore interno
 */
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backup API listening on port ${port}`);
});
