import { TG_TOKEN } from './data.js';
import TelegramBot from 'node-telegram-bot-api';
import ytdl from 'ytdl-core'; // Import ytdl-core library
import fs from 'fs';
const bot = new TelegramBot(TG_TOKEN, { polling: true });

function removeVideoOnExit(fileName) {
    fs.unlink(fileName, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

async function downloadVideo(link) {
    try {
        const videoInfo = (await ytdl.getInfo(link)).videoDetails.title + '.mp4';
        const videoStream = await ytdl(link);
        await videoStream.pipe(fs.createWriteStream(videoInfo));
        return [videoStream, videoInfo];
    } catch (error) {
        console.log(error);
        return 'error';
    }
}

const start = async () => {
    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text === '/start') {
            return bot.sendMessage(chatId, 'Что жмёшь, отправляй ссылку!');
        }
        if (text === '/info') {
            return bot.sendMessage(
                chatId,
                'Я был создан, чтоб ты смог скачивать видео с ютуба'
            );
        }
        if (
            text.indexOf('https://youtu.be/') !== -1 ||
            text.indexOf('https://www.youtube.com/watch?v=') !== -1
        ) {
            try {
                const link = text;
                const [videoStream, videoInfo] = await downloadVideo(link);
                if (videoStream !== 'error') {
                    videoStream.on('finish', async () => {
                        await bot.sendMessage(chatId, 'Видео загружено');
                        try {
                            await bot.sendVideo(chatId, videoInfo);
                        } catch (error) {
                            return bot.sendMessage(
                                chatId,
                                'Произошла ошибка при отправке видео. Кажется оно оказалось слишком длинным'
                            );
                        }
                        await removeVideoOnExit(videoInfo);
                    });
                } else {
                    return bot.sendMessage(
                        chatId,
                        'Произошла ошибка при загрузке видео.'
                    );
                }
            } catch (err) {
                console.log(err);
                return bot.sendMessage(chatId, 'Произошла ошибка при загрузке видео.');
            }
        } else {
            return bot.sendMessage(
                chatId,
                'Что-то ты высрал такое, что моему интеллекту не обработать'
            );
        }
    });
};

start();
