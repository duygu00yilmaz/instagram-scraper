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
        // Daha gerçekçi bir tarayıcı gibi görünmek için başlıklar (headers)
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

        // --- 1. Profil Resmi (En Güvenilir Yöntem) ---
        const picMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (picMatch && picMatch[1]) {
            profileData.profile_pic_url = picMatch[1];
        }

        // --- 2. Profil Adı (En Güvenilir Yöntem: JSON-LD'den al) ---
        let fullName = null;
        try {
            const scriptMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
            if (scriptMatch && scriptMatch[1]) {
                const jsonData = JSON.parse(scriptMatch[1]);
                // JSON yapısındaki ismi bul
                if (jsonData && jsonData.mainEntityofPage && jsonData.mainEntityofPage.name) {
                    fullName = jsonData.mainEntityofPage.name;
                }
            }
        } catch (e) {
            // JSON parse hatası olursa sessizce geç, bir sonraki yöntemi dene
        }

        // Eğer JSON-LD'den bulamadıysa, sayfa başlığından (title) dene
        if (!fullName) {
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1];
                // Başlık formatı: "İsim (@kullaniciadi) • Instagram..."
                const nameMatch = title.match(/^(.*?)\s*$$@[^)]+$$/);
                if (nameMatch && nameMatch[1]) {
                    fullName = nameMatch[1].trim();
                }
            }
        }
        
        profileData.full_name = fullName;

        res.json(profileData);

    } catch (error) {
        console.error("Failed to fetch Instagram page:", error.message);
        res.status(500).json({ error: 'Failed to fetch profile data from Instagram.' });
    }
});

app.listen(PORT, () => {
    console.log(`Instagram proxy server is running on port ${PORT}`);
});
