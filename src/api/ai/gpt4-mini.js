const axios = require('axios');
module.exports = function(app) {
    // Fungsi untuk memanggil API GPT
    async function gptAI(prompt) {
        try {
            const { data } = await axios.post('https://us-central1-openaiprojects-1fba2.cloudfunctions.net/chat_gpt_ai/api.live.text.gen', {
                model: 'gpt-4o-mini',
                temperature: 0.2,
                top_p: 0.2,
                prompt: prompt
            }, {
                headers: {
                    'content-type': 'application/json; charset=UTF-8'
                }
            });

            return data.choices[0].message.content;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Route untuk API GPT
    app.get('/ai/gpt4', async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }

            const result = await gptAI(text);
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
}