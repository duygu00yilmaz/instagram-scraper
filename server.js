const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username query parameter is required.' });
    }

    const targetUrl = `https://www.instagram.com/${username}/`;

    try {
        // Daha gerçekçi bir tarayıcı gibi görünmek için başlıklar (headers) ekledik
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            timeout: 15000 // 15 saniye timeout
        });

        const html = response.data;
        const profileData = {
            username: username,
            full_name: null,
            profile_pic_url: null,
            bio: 'Bu kullanıcının profili gizli.'
        };

        // --- GELİŞMİŞ VERİ AYIKLAMA ---

        // 1. Profil Resmi (Birden fazla olası etiketi deneyelim)
        const picMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                          html.match(/<meta property="og:image:url" content="([^"]+)"/i) ||
                          html.match(/<link rel="image_src" href="([^"]+)"/i);

        if (picMatch && picMatch[1]) {
            profileData.profile_pic_url = picMatch[1];
        }

        // 2. Profil Adı (Sayfa başlığından daha esnek ayıklama)
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1];
            // Başlık formatı: "İsim (@kullaniciadi) • Instagram photos and videos"
            const nameMatch = title.match(/^(.*?)\s*$$@[^)]+$$/);
            if (nameMatch && nameMatch[1]) {
                profileData.full_name = nameMatch[1].trim();
            }
        }

        res.json(profileData);

    } catch (error) {
        console.error("Failed to fetch Instagram page:", error.message);
        res.status(500).json({ error: 'Failed to fetch profile data from Instagram.' });
    }
});

app.listen(PORT, () => {
    console.log(`Instagram proxy server is running on port ${PORT}`);
});
