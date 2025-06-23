const axios = require('axios');

async function animagine(prompt, options = {}) {
    try {
        const {
            negative_prompt = 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry',
            width = 1024,
            height = 1024,
            guidance_scale = 5,
            numInference_steps = 28,
            sampler = 'Euler a',
            aspect_ratio = '1:1',
            style_preset = '(None)',
            use_upscaler = false,
            strength = 0.55,
            upscale_by = 1.5,
            add_quality_tags = true
        } = options;

        const conf = {
            samplers: ['DPM++ 2M Karras', 'DPM++ SDE Karras', 'DPM++ 2M SDE Karras', 'Euler', 'Euler a', 'DDIM'],
            ratios: {
                '1:1': '1024 x 1024',
                '9:7': '1152 x 896',
                '7:9': '896 x 1152',
                '19:13': '1216 x 832',
                '13:19': '832 x 1216',
                '7:4': '1344 x 768',
                '4:7': '768 x 1344',
                '12:5': '1536 x 640',
                '5:12': '640 x 1536'
            },
            styles: ['(None)', 'Anim4gine', 'Painting', 'Pixel art', '1980s', '1990s', '2000s', 'Toon', 'Lineart', 'Art Nouveau', 'Western Comics', '3D', 'Realistic', 'Neonpunk']
        };

        if (!prompt) throw new Error('Prompt is required');
        if (!conf.samplers.includes(sampler)) throw new Error(`Available samplers: ${conf.samplers.join(', ')}`);
        if (!Object.keys(conf.ratios).includes(aspect_ratio)) throw new Error(`Available ratios: ${Object.keys(conf.ratios).join(', ')}`);
        if (!conf.styles.includes(style_preset)) throw new Error(`Available styles: ${conf.styles.join(', ')}`);

        const session_hash = Math.random().toString(36).substring(2);
        await axios.post(`https://asahina2k-animagine-xl-4-0.hf.space/queue/join?`, {
            data: [
                prompt,
                negative_prompt,
                Math.floor(Math.random() * 2147483648),
                width,
                height,
                guidance_scale,
                numInference_steps,
                sampler,
                conf.ratios[aspect_ratio],
                style_preset,
                use_upscaler,
                strength,
                upscale_by,
                add_quality_tags
            ],
            event_data: null,
            fn_index: 5,
            trigger_id: 43,
            session_hash: session_hash
        });

        const { data } = await axios.get(`https://asahina2k-animagine-xl-4-0.hf.space/queue/data?session_hash=${session_hash}`);

        let result;
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data:')) {
                const d = JSON.parse(line.substring(6));
                if (d.msg === 'process_completed') result = d.output.data[0][0].image.url;
            }
        }

        if (!result) throw new Error('Gagal memproses gambar');

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = function (app) {
    app.post('/random/animagine', async (req, res) => {
        try {
            const {
                prompt,
                negative_prompt,
                width,
                height,
                guidance_scale,
                numInference_steps,
                sampler,
                aspect_ratio,
                style_preset,
                use_upscaler,
                strength,
                upscale_by,
                add_quality_tags
            } = req.body;

            if (!prompt) return res.status(400).json({ status: false, error: 'Prompt tidak boleh kosong' });

            const result = await animagine(prompt, {
                negative_prompt,
                width: parseInt(width) || 1024,
                height: parseInt(height) || 1024,
                guidance_scale: parseFloat(guidance_scale) || 5,
                numInference_steps: parseInt(numInference_steps) || 28,
                sampler,
                aspect_ratio,
                style_preset,
                use_upscaler: use_upscaler === 'true' || use_upscaler === true,
                strength: parseFloat(strength) || 0.55,
                upscale_by: parseFloat(upscale_by) || 1.5,
                add_quality_tags: add_quality_tags === 'true' || add_quality_tags === true
            });

            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};