import { Telegraf, Markup } from './telegraf/lib/index.js'
import { first_ask, ask, askImage } from './gpt.js'
import { promptinize } from './add.js'
import express from 'express';
import fs from 'fs';
import { TOKEN, roles, ishf } from './config.js';

let queue = [];

async function webserv() {
    const app = express();

    const port = 7860;

    app.get('/', (req, res) => {
        res.send('Hello World!');
    });

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

if (ishf) { webserv() }

let rps = 0;
let msgOneTime = 0;


const bot = new Telegraf(process.env.BOT_TOKEN || TOKEN);

bot.catch(async (err) => {
    console.log('Ooops', err);
});


let context = {}
let precontext = {}

let creative = {
    1: 'Строгий',
    2: 'Сбалансированный',
    3: 'Творческий',
    4: 'Fast-model'
}



for (const role of roles) {
    bot.action(role.id, async (ctx) => {
        const userId = ctx.from.id
        precontext[userId].role = role.id
        await ctx.editMessageText('Хорошо, ответь на эти вопросы: ', welcomeKeyboard);
    })
}

const welcomeKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Креатив', 'creative')],
    [Markup.button.callback('Роль', 'role')],
    [Markup.button.callback('-> Создать', 'create')]
]);

bot.start(async (ctx) => { await ctx.reply('Привет, я Сидни.'); })

async function creatsel(ctx, userId) {
    let keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Строгий', 'creative1')],
        [Markup.button.callback('Сбалансированный', 'creative2')],
        [Markup.button.callback('Креативный', 'creative3')],
        [Markup.button.callback('FAST-креатив', 'creative4')],
        [Markup.button.callback('<- Назад', 'backmain')],
    ])
    try {
        await ctx.editMessageText(`Какой креатив дать нейросети? \n${JSON.stringify(precontext[userId])} ${Math.random()}`, keyboard);
    }
    catch { console.log('err') }
}

async function rolesel(ctx) {

    const userId = ctx.from.id;

    let rolesbtn = [];

    for (const role of roles) {
        rolesbtn.push([Markup.button.callback(role.name, role.id)]);
    }

    let keyboard = Markup.inlineKeyboard([
        ...rolesbtn,
        [Markup.button.callback('<- Назад', 'backmain')],
    ])
    try {
        await ctx.editMessageText(`Какую роль дать боту? \n${JSON.stringify(precontext[userId])} ${Math.random()}`, keyboard);
    }
    catch { console.log('err') }
}

bot.action('role', async (ctx) => { rolesel(ctx) })

bot.command('new', async (ctx) => {
    const userId = ctx.from.id;
    precontext[userId] = { creative: 2, role: 'Sydney' };

    await ctx.reply("Хорошо, ответь на эти вопросы: \n*Поскольку это бета версия бот может вести себя нестабильно (пропадать контекст, падать)*", {
        reply_to_message_id: ctx.message.message_id,
        reply_markup: {
            inline_keyboard: [
                [{ text: "Креатив", callback_data: "creative" }],
                [{ text: "Роль", callback_data: "role" }],
                [{ text: "Разработчик", url: "https://t.me/ddosxd" }],
                [{ text: "Канал", url: "https://t.me/SydneyAiChannel" }],
                [{ text: "Обсуждение", url: "https://t.me/ddosxdBotForum" }],
                [{ text: "--> Создать", callback_data: "create" }]
            ]
        }
    });
});

bot.command('dev', async (ctx) => {
    try {
        // отправляем сообщение с кнопкой
        await ctx.reply("Хорошо, вот разработчик", {
            reply_to_message_id: ctx.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Разработчик", url: "ddosxd.t.me/" }],
                ]
            }
        });
    } catch (error) {
        // ловим ошибку и выводим ее в консоль
        console.error(error);
    }
});

bot.command('img', async (ctx) => { botImg(ctx); });

async function botImg(ctx) {
    const userId = ctx.from.id;
    let IMAGEprompt;
    try {
        IMAGEprompt = ctx.message.text.slice(5);
    } catch (error) {
        ctx.reply('А где?', {
            reply_to_message_id: ctx.message.message_id,
        });
        return;
    };

    let path = `./photos/${userId}/${Date.now()}`.replaceAll(' ', '_');
    console.log(`@${ctx.message.from.username} (${ctx.message.from.first_name} ${ctx.message.from.last_name}, ${ctx.message.chat.type}) ask txt2img`)
    let bot_tmp = await ctx.reply(`Генерирую фоты по промпту ${IMAGEprompt}`);
    fs.mkdir(path, { recursive: true }, (err) => { if (err) { console.error(err); } });
    try {
        await askImage(path, IMAGEprompt);
    } catch (error) {
        ctx.reply(
            `Тут txt2img не хочет работать\n${error}`,
            {
                reply_to_message_id: ctx.message.message_id
            }
        )
    }
    const files = fs.readdirSync(path);

    let mediaGroup = [];

    for (const img of files) {
        mediaGroup.push({
            type: 'photo',
            media: { source: `${path}/${img}` },
            caption: ''
        });
    };

    if (mediaGroup.length != 0) {
        await ctx.replyWithMediaGroup(mediaGroup, { reply_to_message_id: ctx.message.message_id });
        await ctx.deleteMessage(bot_tmp.message_id);
    } else {
        await bot.telegram.editMessageText(bot_tmp.chat.id, bot_tmp.message_id, null, `Тут txt2img ничего не выдал`);
    };

};

bot.action('backmain', async (ctx) => { await ctx.editMessageText('Хорошо, ответь на эти вопросы: ', welcomeKeyboard); });

bot.action('creative', async (ctx) => {
    const userId = ctx.from.id;
    await creatsel(ctx, userId);
});

bot.action('creative1', async (ctx) => {
    const userId = ctx.from.id;
    if (precontext[userId].creative && precontext[userId].creative != 1) {
        precontext[userId].creative = 1;
        await creatsel(ctx, userId);
    };
})

bot.action('creative2', async (ctx) => {
    const userId = ctx.from.id;
    if (precontext[userId].creative && precontext[userId].creative != 2) {
        precontext[userId].creative = 2;
        await creatsel(ctx, userId);
    };
})

bot.action('creative3', async (ctx) => {
    const userId = ctx.from.id;
    if (precontext[userId].creative && precontext[userId].creative != 3) {
        precontext[userId].creative = 3;
        await creatsel(ctx, userId);
    };
})

bot.action('creative4', async (ctx) => {
    const userId = ctx.from.id;
    if (precontext[userId].creative && precontext[userId].creative != 4) {
        precontext[userId].creative = 4;
        await creatsel(ctx, userId);
    };
})


bot.action('create', async (ctx) => {
    const userId = ctx.from.id;

    if (!(userId in precontext)) {
        precontext[userId] = { creative: 2 };
    }

    let usernew = precontext[userId];
    await ctx.editMessageText(`Окей, креатив = ${creative[usernew.creative]}, роль = ${usernew.role}`);

    let pr = ``
    for (const role of roles) {
        if (precontext[userId].role == role.id) {
            pr = `${role.prompt}`;
        }
    }

    context[userId] = {
        tone: usernew.creative,
        prompt: pr,
        count: 1,
        lastResponse: null
    }
});


bot.on('text', async (ctx) => {
    solve(ctx)
})

async function solve(ctx) {
    const userId = ctx.from.id;

    if (!context[userId]) { return await ctx.reply('Похоже у тебя ещё нет диалога. Ты его можешь создать при помощи /new', { reply_to_message_id: ctx.message.message_id }); }

    console.log(`@${ctx.message.from.username} (${ctx.message.from.first_name} ${ctx.message.from.last_name}, ${ctx.message.chat.type}) ask Sydney. RPS: ${rps} THREADS: ${msgOneTime}`)

    let bot_tmp = await ctx.reply('*Waiting*', {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: 'MarkdownV2'
    });

    queue.push({
        ctx: ctx,
        bot_tmp: bot_tmp
    })

    if (queue.length === 1) {
        // Если очередь была пуста, начните обрабатывать запросы
        processQueue();
    } else {
        await bot.telegram.editMessageText(userId, bot_tmp.message_id, null, `*Request queued POSITION:${queue.length} :(*`);
    }
}

async function processQueue() {
    if (queue.length === 0) {
        return;
    }
    const request = queue[0];
    await sendRequest(request, function () {
        queue.shift();
        processQueue();
    });
}

async function sendRequest(task, callback) {
    let ctx = task.ctx;
    let bot_tmp = task.bot_tmp;
    await nextStepAsk(ctx, ctx.from.id, ctx.message.text, bot_tmp);
    callback();
}

async function nextStepAsk(ctx, userId, text, bot_tmp) {
    msgOneTime++;
    let { r, out, kb, iser } = await askBot(ctx, userId, text, bot_tmp);

    if (iser == false) {
        try {
            await ctx.deleteMessage(bot_tmp.message_id);
            await ctx.reply(r || out, {
                reply_markup: {
                    keyboard: kb,
                    one_time_keyboard: true,
                    resize_keyboard: true
                },
                reply_to_message_id: ctx.message.message_id
            });
        } catch (error) {
        }
    }

    msgOneTime += -1;
    await generateImg(r, userId, ctx);
}

async function askBot(ctx, userId, text, bot_tmp) {
    let response = null;
    let start = new Date();
    let end = new Date();
    let r = null;

    await bot.telegram.sendChatAction(ctx.chat.id, 'typing');

    try {
        let q = await generate(userId, response, text, end, start, bot_tmp);
        response = q.response;
        r = q.r;
    } catch (error) {
        await errorCatch(error, userId, bot_tmp);
        let iser = true;
        return { iser, iser, iser, iser }
    }

    let out = response.response;
    let kb = [];

    let sugresp = response.details.suggestedResponses;


    try { sugresp.forEach(i => { kb.push([i.text]); }); }
    catch { }

    kb.push(['/new'])

    let iser = false;
    return { r, out, kb, iser };
}

async function generate(userId, response, text, end, start, bot_tmp) {
    let oldr = '';
    let r = '';

    if (context[userId].lastResponse == null) {
        response = await first_ask(
            text, true, context[userId].tone, context[userId].prompt, (token) => {
                end = new Date();
                let timeDiff = end - start; // difference in milliseconds
                r += token;
                if (r.trim() != oldr.trim() && timeDiff > 1000) {
                    try {
                        bot.telegram.editMessageText(userId, bot_tmp.message_id, null, `${r} ▋`);
                    } catch (error) {
                        console.log(error);
                    }
                    start = new Date();
                }
                oldr = r;
            }
        );
        context[userId].lastResponse = response;
    } else {
        response = await ask(
            text, context[userId].lastResponse, (token) => {
                end = new Date();
                let timeDiff = end - start; // difference in milliseconds
                r += token;
                if (r.trim() != oldr.trim() && timeDiff > 1000) {
                    try {
                        bot.telegram.editMessageText(userId, bot_tmp.message_id, null, `${r} ▋`);
                    } catch (error) {
                        console.log(error);
                    }
                    start = new Date();
                }
                oldr = r;
            }
        );
    };
    return {
        response: response,
        r: r
    };
}


async function errorCatch(error, userId, bot_tmp) {
    let errrr = `${error}`;
    await bot.telegram.editMessageText(userId, bot_tmp.message_id, null, `Sorry, Network error: \n${errrr.split('\n')[0]}`);
    console.log(`${errrr.split('\n')[0]}`)
    return;
}

async function generateImg(r, userId, ctx) {
    let prompts = await promptinize(r);
    if (prompts.length != 0) {
        await askI(userId, ctx, prompts);
    }
}

async function askI(userId, ctx, prompts) {
    let path = `./photos/${userId}/${Date.now()}`.replaceAll(' ', '_');
    console.log(`Sydney from @${ctx.message.from.username} (${ctx.message.from.first_name} ${ctx.message.from.last_name}, ${ctx.message.chat.type}) ask txt2img`)
    await ctx.reply(`Генерирую фоты по промпту ${prompts[0]}`);
    fs.mkdir(path, { recursive: true }, (err) => { if (err) { console.error(err); } });
    try { await askImage(path, prompts[0]); } catch { return; }
    const files = fs.readdirSync(path);
    for (const file of files) {
        const filePath = `${path}/${file}`;
        await ctx.replyWithPhoto({ source: filePath });
    }
}

setInterval(() => {
    rps = 0;
}, 1000)


bot.launch()


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));