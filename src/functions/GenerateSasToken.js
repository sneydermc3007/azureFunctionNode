const { app } = require('@azure/functions');
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

app.http('GenerateSasToken', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const containerClient = blobServiceClient.getContainerClient(containerName);

            const permissions = new BlobSASPermissions();
            permissions.write = true;
            permissions.create = true;

            const startDate = new Date();
            const expiryDate = new Date(startDate);
            expiryDate.setMinutes(startDate.getMinutes() + 10); // Token válido por 10 minutos

            const sasToken = generateBlobSASQueryParameters({
                containerName: containerName,
                permissions,
                startsOn: startDate,
                expiresOn: expiryDate,
                version: '2024-08-04',
            }, blobServiceClient.credential).toString();

            return {
                status: 200,
                body: JSON.stringify({
                    sasToken: `${containerClient.url}?${sasToken}`
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } catch (error) {
            return {
                status: 500,
                body: JSON.stringify({ error: error.message }),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        }
    }
});