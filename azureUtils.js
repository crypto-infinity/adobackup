const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

// Upload su Azure Blob Storage
async function uploadToBlobStorage(storageAccount, container, sourcePath, blobName, accessKey) {
  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccount, accessKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccount}.blob.core.windows.net`,
    sharedKeyCredential
  );
  const containerClient = blobServiceClient.getContainerClient(container);
  await containerClient.createIfNotExists();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadFile(sourcePath);
}

module.exports = {
  uploadToBlobStorage
};
