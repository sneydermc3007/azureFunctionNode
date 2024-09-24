const { app } = require('@azure/functions');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { DefaultAzureCredential } = require('@azure/identity');
const dotenv = require('dotenv');

dotenv.config();

app.http('CreatePythonWebJob', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const scriptContent = `
import sys
print("Hello from dynamically generated Python script!")
        `;

        const scriptPath = path.join(__dirname, 'script.py');
        const zipPath = path.join(__dirname, 'script.zip');
        const settingsPath = path.join(__dirname, 'settings.job');

        const cronSchedule = {
            schedule: "0 */5 * * * *"
        };

        try {
            fs.writeFileSync(scriptPath, scriptContent);
            fs.writeFileSync(settingsPath, JSON.stringify(cronSchedule));

            const zip = new AdmZip();
            zip.addLocalFile(scriptPath);
            zip.addLocalFile(settingsPath);
            zip.writeZip(zipPath);
            // console.log(`Zip created at: ${zipPath}`);

            const credential = new DefaultAzureCredential();
            const token = (await credential.getToken('https://management.azure.com/.default')).token;
            
            const webJobUrl = `https://${process.env.AZURE_WEBAPP_NAME}.scm.azurewebsites.net/api/triggeredwebjobs/${process.env.WEBJOB_NAME}`;

            const response = await axios.put(webJobUrl, fs.createReadStream(zipPath), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="${process.env.WEBJOB_NAME}.zip"`
                }
            });

            return { status: 200, body: 'WebJob uploaded and scheduled successfully' };
        } catch (error) {
            console.error('Error status:', error.response.status);
            console.error('Error data:', error.response.data);
            return { status: 500, body: `Error: ${error.message}` };
        }
    }
});
