const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username parameter is missing' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new", // Yeni headless modu
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(3000); // 3 saniye bekle

        const data = await page.evaluate(() => {
            const picUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || null;
            const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null;
            return { profile_pic_url: picUrl, full_name: title };
        });

        await browser.close();

        let fullName = null;
        if (data.full_name) {
            const match = data.full_name.match(/^(.*?)\s*$$/);
            fullName = match ? match[1].trim() : data.full_name.trim();
        }

        res.json({
            username: username,
            profile_pic_url: data.profile_pic_url,
            full_name: fullName
        });

    } catch (error) {
        if (browser) await browser.close();
        console.error(error);
        res.status(500).json({ error: 'Scraping failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Instagram scraper running on port ${PORT}`);
});
