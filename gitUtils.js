const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');

// Clona repository Git
async function cloneRepository(repoUrl, destinationPath, pat = null, username = '') {
  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { recursive: true, force: true });
  }
  let cloneUrl = repoUrl;
  if (pat) {
    // Inserisce PAT nell'URL per Azure DevOps
    const url = new URL(repoUrl);
    cloneUrl = url.toString().replace('https://', `https://${username}:${pat}@`);
  }
  return new Promise((resolve, reject) => {
    exec(`git clone ${cloneUrl} "${destinationPath}"`, (error, stdout, stderr) => {
      if (error) return reject(stderr || error.message);
      resolve(stdout);
    });
  });
}

// Comprimi cartella in zip
async function compressFolder(sourcePath, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', err => reject(err));
    archive.pipe(output);
    archive.directory(sourcePath, false);
    archive.finalize();
  });
}

module.exports = {
  cloneRepository,
  compressFolder
};
