const axios = require('axios');
const FormData = require('form-data');

class IllariaUpscaler {
    constructor() {
        this.api_url = 'https://thestinger-ilaria-upscaler.hf.space/gradio_api';
        this.file_url = 'https://thestinger-ilaria-upscaler.hf.space/gradio_api/file=';
    }

    generateSession() {
        return Math.random().toString(36).substring(2);
    }

    async upload(buffer) {
        try {
            const upload_id = this.generateSession();
            const orig_name = `rynn_${Date.now()}.jpg`;
            const form = new FormData();
            form.append('files', buffer, orig_name);
            const { data } = await axios.post(`${this.api_url}/upload?upload_id=${upload_id}`, form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            return {
                orig_name,
                path: data[0],
                url: `${this.file_url}${data[0]}`
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async process(buffer, options = {}) {
        try {
            const {
                model = 'RealESRGAN_x4plus',
                denoice_strength = 0.5,
                resolution = 4,
                fase_enhancement = false
            } = options;

            const _model = [
                'RealESRGAN_x4plus',
                'RealESRNet_x4plus',
                'RealESRGAN_x4plus_anime_6B',
                'RealESRGAN_x2plus',
                'realesr-general-x4v3'
            ];

            if (!Buffer.isBuffer(buffer)) throw new Error('Image buffer is required');
            if (!_model.includes(model)) throw new Error(`Available models: ${_model.join(', ')}`);
            if (denoice_strength > 1) throw new Error('Max denoice strength: 1');
            if (resolution > 6) throw new Error('Max resolution: 6');
            if (typeof fase_enhancement !== 'boolean') throw new Error('Fase enhancement must be boolean');

            const image_url = await this.upload(buffer);
            const session_hash = this.generateSession();
            const d = await axios.post(`${this.api_url}/queue/join?`, {
                data: [
                    {
                        path: image_url.path,
                        url: image_url.url,
                        orig_name: image_url.orig_name,
                        size: buffer.length,
                        mime_type: 'image/jpeg',
                        meta: {
                            _type: 'gradio.FileData'
                        }
                    },
                    model,
                    denoice_strength,
                    fase_enhancement,
                    resolution
                ],
                event_data: null,
                fn_index: 1,
                trigger_id: 20,
                session_hash: session_hash
            });

            const { data } = await axios.get(`${this.api_url}/queue/data?session_hash=${session_hash}`);

            let result;
            const lines = data.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const d = JSON.parse(line.substring(6));
                    if (d.msg === 'process_completed') result = d.output.data[0].url;
                }
            }

            return result;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = function (app) {
    const illaria = new IllariaUpscaler();

    app.post('/tools/upscale', async (req, res) => {
        try {
            const file = req.files?.image;
            if (!file || !file.data) {
                return res.status(400).json({ status: false, error: 'Image file is required (form-data with key "image")' });
            }

            const {
                model = 'RealESRGAN_x4plus',
                denoice_strength = 0.5,
                resolution = 4,
                fase_enhancement = false
            } = req.body;

            const result = await illaria.process(file.data, {
                model,
                denoice_strength: parseFloat(denoice_strength),
                resolution: parseInt(resolution),
                fase_enhancement: fase_enhancement === 'true'
            });

            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
}