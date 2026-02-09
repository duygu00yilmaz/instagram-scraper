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
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            timeout: 15000
        });

        const html = response.data;
        const profileData = {
            username: username,
            full_name: null,
            profile_pic_url: null,
            bio: 'Bu kullanıcının profili gizli.'
        };

        const picMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (picMatch) {
            profileData.profile_pic_url = picMatch[1];
        }

        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
            const title = titleMatch[1];
            const nameMatch = title.match(/^(.*?)\s*$$@[^)]+$$/);
            if (nameMatch) {
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
