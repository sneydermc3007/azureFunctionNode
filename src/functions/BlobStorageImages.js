const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

app.http('ImagesPegasusUpdate', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
        const blobName = request.query.get('imageName');
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        const blobClient = containerClient.getBlobClient(blobName);
        
        try {
            const downloadResponse = await blobClient.downloadToBuffer();
            const base64Image = downloadResponse.toString('base64');
            return {
                status: 200,
                body: base64Image
            };
        } catch (error) {
            return {
                status: 500,
                body: `Error: ${error.message}`
            };
        }
    }
});
