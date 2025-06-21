const axios = require('axios');

async function saveweb2zip(url, options = {}) {
    try {
        if (!url) throw new Error('Url is required');
        url = url.startsWith('https://') ? url : `https://${url}`;
        const {
            renameAssets = false,
            saveStructure = false,
            alternativeAlgorithm = false,
            mobileVersion = false
        } = options;

        const { data } = await axios.post('https://copier.saveweb2zip.com/api/copySite', {
            url,
            renameAssets,
            saveStructure,
            alternativeAlgorithm,
            mobileVersion
        }, {
            headers: {
                accept: '*/*',
                'content-type': 'application/json',
                origin: 'https://saveweb2zip.com',
                referer: 'https://saveweb2zip.com/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        while (true) {
            const { data: process } = await axios.get(`https://copier.saveweb2zip.com/api/getStatus/${data.md5}`, {
                headers: {
                    accept: '*/*',
                    'content-type': 'application/json',
                    origin: 'https://saveweb2zip.com',
                    referer: 'https://saveweb2zip.com/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                }
            });

            if (!process.isFinished) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            } else {
                return {
                    url,
                    error: {
                        text: process.errorText,
                        code: process.errorCode,
                    },
                    copiedFilesAmount: process.copiedFilesAmount,
                    downloadUrl: `https://copier.saveweb2zip.com/api/downloadArchive/${process.md5}`
                };
            }
        }

    } catch (error) {
        console.error(error.message);
        throw new Error('No result found');
    }
}

module.exports = function (app) {
    app.get('/tools/saveweb2zip', async (req, res) => {
        try {
            const { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion } = req.query;

            if (!url) return res.status(400).json({ status: false, message: 'Parameter url tidak boleh kosong' });

            const result = await saveweb2zip(url, {
                renameAssets: renameAssets === 'true',
                saveStructure: saveStructure === 'true',
                alternativeAlgorithm: alternativeAlgorithm === 'true',
                mobileVersion: mobileVersion === 'true'
            });

            res.json({
                status: true,
                creator: 'Mamix',
                result
            });

        } catch (err) {
            res.status(500).json({ status: false, message: err.message });
        }
    });
};