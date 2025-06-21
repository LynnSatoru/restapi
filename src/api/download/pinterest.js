const axios = require("axios");

// Optional: resolve shortlink pin.it
async function resolvePinterestUrl(shortUrl) {
  try {
    const response = await axios.get(shortUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 301 || status === 302,
    });

    return response.headers.location || shortUrl;
  } catch (err) {
    console.error("Gagal resolve URL:", err.message);
    return shortUrl;
  }
}

// Function untuk ambil data dari Siputzx API
async function pindlVideo(url) {
  const endpoint = `https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`;

  try {
    const { data } = await axios.get(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    return data;
  } catch (error) {
    console.error("Error from Siputzx API:", error.message);
    return null;
  }
}

module.exports = function (app) {
  app.get('/download/pinterest', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ status: false, message: "Missing url query." });
    }

    try {
      const finalUrl = await resolvePinterestUrl(url); // biar shortlink pin.it bisa di-handle
      const results = await pindlVideo(finalUrl);

      res.status(200).json({
        status: true,
        creator: "Mamix",
        result: results || null
      });
    } catch (error) {
      res.status(500).json({ status: false, message: `Error: ${error.message}` });
    }
  });
};
