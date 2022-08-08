require('dotenv').config();
const express = require("express");
const axios = require('axios');
const cheerio = require('cheerio');
const {resetWatchers} = require("nodemon/lib/monitor/watch");

const {PORT = 9999, TOKEN, SERVER_URL} = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const NUM_IN_PAGE = 100;
const LIBRARY_URL = `https://lib.gangseo.seoul.kr/search/tot/result?st=KWRD&y=0&x=0&si=TOTAL&bk_6=GS000002&cpp=${NUM_IN_PAGE}`;

const app = express();
app.use(express.json());

const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
};

app.post(URI, async (req, res) => {
    const chatId = req.body.message.chat.id;
    const searchQuery = req.body.message.text;

    let message = 'No message to send';

    try {
        const searched = await axios.get(`${LIBRARY_URL}&q=${encodeURI(searchQuery)}`);

        const $ = cheerio.load(searched.data);
        const result = [];

        $('div.result ul.resultList li.items > dl > dd.title > a').each((i, item) => {
            const text = $(item).text();
            result.push(`__${i + 1}.${text}__`);
        });

        message = result.join('\r\n');
    } catch (e) {
        message = 'We got error on searching';
    } finally {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'markdown',
        });
    }

    return res.send();
})


app.listen(PORT, async () => {
    console.log("Initializing for bot");
    await init();
    console.log(`listening on ${PORT}`);
});
