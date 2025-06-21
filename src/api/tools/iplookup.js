module.exports = function(app) {
    app.get('/tools/iplookup', async (req, res) => {
        try {
            const { apikey } = req.query;
            if (!global.apikey.includes(apikey)) {
                return res.json({ status: false, error: 'Apikey invalid' });
            }

            const { q } = req.query;
            if (!q) {
                return res.json({ status: false, error: 'Query is required' });
            }

            const result = await global.fetchJson(`https://ipinfo.io/${q}/json`);
            
            res.status(200).json({
                status: true,
                result: {
                    ip: result.ip,
                    hostname: result.hostname || "N/A",
                    city: result.city,
                    region: result.region,
                    country: result.country,
                    loc: result.loc,
                    org: result.org,
                    timezone: result.timezone
                }
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};