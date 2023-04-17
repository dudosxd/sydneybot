import { Telegraf, Markup } from './telegraf/lib/index.js'
import { first_ask, ask, askImage, first_ask_gpt, ask_gpt, first_ask_gpt4, ask_gpt4, ChatGPTClient, GPT4Client, njb } from './gpt.js'
import { promptinize } from './add.js'
import fs from 'fs';
import { TOKEN, roles, ishf, Update } from './config.js';
import { webserv } from './webserv.js';

let group = {};

if (ishf) { webserv() }

let rps = 0;
let msgOneTime = 0;


const bot = new Telegraf(process.env.BOT_TOKEN || TOKEN);
bot.catch(async (err) => {console.log('Ooops', err);});


let context = {}
let precontext = {}

let creative = {
    1: 'Строгий',
    2: 'Сбалансированный',
    3: 'Творческий',
    4: 'Fast-model'
}

bot.action('backmain', async (ctx) => { await ctx.editMessageText('Хорошо, ответь на эти вопросы: ', welcomeKeyboard); });

bot.action('jailbreak', async (ctx) => {
    await ctx.editMessageText('Выключить ли правила?', Markup.inlineKeyboard([
        [Markup.button.callback('Да, НИКАКИХ ПРАВИЛ!!!', 'jailbreak1')],
        [Markup.button.callback('Нет, не тронь', 'jailbreak2')],
        [Markup.button.callback('<- Назад', 'backmain')]
    ]));
});

const handleJailbreakAction = async (ctx, answer) => {
    const userId = ctx.from.id;
    precontext[userId].jailbreak = answer;
    await ctx.editMessageText('Хорошо, ответь на эти вопросы: ', welcomeKeyboard);
}

bot.action('jailbreak1', async (ctx) => handleJailbreakAction(ctx, true));

bot.action('jailbreak2', async (ctx) => handleJailbreakAction(ctx, false));

const handleCreativeAction = async (ctx, answer) => {
    const userId = ctx.from.id;
    if (precontext[userId].creative && precontext[userId].creative != answer) {
        precontext[userId].creative = answer;
        await creatsel(ctx, userId);
    }
}

async function creatsel(ctx, userId) {
    let keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Строгий', 'creative1')],
        [Markup.button.callback('Сбалансированный', 'creative2')],
        [Markup.button.callback('Креативный', 'creative3')],
        [Markup.button.callback('FAST-креатив', 'creative4')],
        [Markup.button.callback('<- Назад', 'backmain')],
    ])
    await ctx.editMessageText(`Какой креатив дать нейросети? \n${JSON.stringify(precontext[userId])} ${Math.random()}`, keyboard);
}

bot.action('creative', async (ctx) => creatsel(ctx, ctx.from.id));

bot.action('creative1', async (ctx) => handleCreativeAction(ctx, 1));

bot.action('creative2', async (ctx) => handleCreativeAction(ctx, 2));

bot.action('creative3', async (ctx) => handleCreativeAction(ctx, 3));

bot.action('creative4', async (ctx) => handleCreativeAction(ctx, 4));

bot.action('aibackend', async (ctx) => {
    const userId = ctx.from.id;
    if (precontext[userId].aibackend) {
        let keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Сидни (gpt-4, internet, bugs)', 'aiback1')],
            [Markup.button.callback('ChatGPT (gpt-3.5, w/out inet)', 'aiback2')],
            [Markup.button.callback('GPT-4', 'aiback3')],
            [Markup.button.callback('<- Назад', 'backmain')],
        ])
        await ctx.editMessageText(`Какую нейросеть использовать?`, keyboard);
    };
});

const handleAIBackendAction = async (ctx, backend) => {
    const userId = ctx.from.id;
    precontext[userId].aibackend = backend;
    await ctx.editMessageText('Хорошо, ответь на эти вопросы: ', welcomeKeyboard);
}

bot.action('aiback1', async (ctx) => handleAIBackendAction(ctx, 'bing'));

bot.action('aiback2', async (ctx) => handleAIBackendAction(ctx, 'openai'));

bot.action('aiback3', async (ctx) => handleAIBackendAction(ctx, 'gpt4'));

async function rolesel(ctx) {
  const userId = ctx.from.id;
  let rolesbtn = roles.map(role => [Markup.button.callback(role.name, role.id)]);

  let keyboard = Markup.inlineKeyboard([
    ...rolesbtn,
    [Markup.button.callback('<- Назад', 'backmain')],
  ]);

  await ctx.editMessageText(`Какую роль дать боту? \n${JSON.stringify(precontext[userId])} ${Math.random()}`, keyboard);
}

for (const role of roles) {
  bot.action(role.id, async (ctx) => {
    const userId = ctx.from.id
    precontext[userId].role = role.id

    await ctx.editMessageText('Хорошо, ответь на эти вопросы: ', welcomeKeyboard);
  });
}

bot.action('role', rolesel);

const welcomeKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Креатив', 'creative')],
    [Markup.button.callback('Роль', 'role')],
    [Markup.button.callback('Нейросеть', 'aibackend')],
    [Markup.button.callback('Джейлбрейк', 'jailbreak')],
    [Markup.button.callback('-> Создать', 'create')]
]);

bot.start(async (ctx) => { await ctx.reply('Привет, я Сидни.'); })

bot.command('new', async (ctx) => {
    const userId = ctx.from.id;
    precontext[userId] = { creative: 2, role: 'Sydney',aibackend: `openai`, jailbreak: true };

    await ctx.reply("Хорошо, ответь на эти вопросы: \n*Поскольку это бета версия бот может вести себя нестабильно (пропадать контекст, падать)*", {
        reply_to_message_id: ctx.message.message_id,
        reply_markup: {
            inline_keyboard: [
                [{ text: "Креатив", callback_data: "creative" }],
                [{ text: "Роль", callback_data: "role" }],
                [{ text: "Нейросеть",callback_data: "aibackend" }],
                [{ text: "Джейлбрейк",callback_data: "jailbreak" }],
                [{ text: "Обсуждение", url: "https://t.me/ddosxdBotForum" }],
                [{ text: "--> Создать", callback_data: "create" }]
            ]
        }
    });
});


bot.command('reset', async (ctx) => {

    const userId = ctx.message.from.id;
    const groupId = ctx.message.chat.id;

    if (!group[groupId]) {group[groupId] = {}};
    group[groupId][userId] = {
        bing: {isFirst: true, lastResponse: null},
        sydney: {isFirst: true, lastResponse: null},
        gpt4: {messages:[]},
        gpt4s: {messages:[]},
        chatgpt: {messages:[]},
        chatgpts: {messages:[]}
    }

    await ctx.reply(`Контекст сброшен`, {
        reply_to_message_id: ctx.message.message_id 
    });

})

bot.command('dev', async (ctx) => {
    await ctx.reply("Хорошо, вот разработчик", {
        reply_to_message_id: ctx.message.message_id,
        reply_markup: {
            inline_keyboard: [
                [{ text: "Разработчик", url: "ddosxd.t.me/" }],
            ]
        }
    });
});


bot.command('img', (ctx) => {botImg(ctx);});

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
        console.log(error)
        ctx.reply(
            `Тут txt2img не хочет работать\n${error}`,
            {
                reply_to_message_id: ctx.message.message_id
            }
        )
      return;
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

bot.action('create', async (ctx) => {
    const userId = ctx.from.id;

    if (!(userId in precontext)) {
        precontext[userId] = { creative: 2, aibackend: `bing` };
    }

    let usernew = precontext[userId];
    await ctx.editMessageText(`Окей, креатив = ${creative[usernew.creative]}, роль = ${usernew.role}, нейросеть = ${usernew.aibackend}, Джейлбрейк = ${usernew.jailbreak}`);

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
        lastResponse: null,
        aiback: usernew.aibackend,
        jailbreak: usernew.jailbreak
    }
});


bot.on('text', async (ctx) => {
    if (ctx.message.chat.type == `private`) { solve(ctx); }
    else { group_solve(ctx); } ;
})

async function group_solve(ctx) {
    const userId = ctx.message.from.id;
    const groupId = ctx.message.chat.id;
    
    let msg = ctx.message.text.split(' ');
    let ai = msg.shift();
    msg = msg.join(` `)

    if (!group[groupId]) {group[groupId] = {}};
    if (!group[groupId][userId]) {group[groupId][userId] = {
        bing: {isFirst: true, lastResponse: null},
        sydney: {isFirst: true, lastResponse: null},
        gpt4: {messages:[]},
        gpt4s: {messages:[]},
        chatgpt: {messages:[]},
        chatgpts: {messages:[]}
    }}

    let user = group[groupId][userId];

    let txt = ``;

    if (ai == '/bing') {
        if (user.bing.isFirst == true) {
            let resp = await first_ask(msg,false,2,``,async () => {})
            user.bing.isFirst = false;
            user.bing.lastResponse = resp;
            txt = resp.response;
        } else {
            let lastResp = user.bing.lastResponse;
            let resp = await ask(msg,lastResp,()=>{});
            user.bing.lastResponse = resp;
            txt = resp.result;
        }
    } else
    if (ai == '/sydney') {
        if (user.sydney.isFirst == true) {
            let resp = await first_ask(msg,true,2,``,async () => {})
            user.sydney.isFirst = false;
            user.sydney.lastResponse = resp;
            txt = resp.response;
        } else {
            let lastResp = user.sydney.lastResponse;
            let resp = await ask(msg,lastResp,()=>{});
            user.sydney.lastResponse = resp;
            txt = resp.result;
        }
    } else
    if (ai == '/gpt4') {

        let messages = user.gpt4.messages;
        console.log(messages)
        messages.push({
            role: `user`,
            content: msg,
        })
        let { response, newMessages } = await GPT4Client.ask(messages)

        txt = response;
        user.gpt4.messages = messages;

    } else
    if (ai == '/gpt4+sydney') {


        if (user.gpt4s.messages.length == 0) {

            let messages = [
                {
                    role: `system`,
                    content: njb
                },
                {
                    role: `user`,
                    content: msg
                }
            ]

            let { response, newmessages } = await GPT4Client.ask(messages)

            user.gpt4s.messages = messages;
            txt = response;
        } else {
            let messages = user.gpt4s.messages;
            messages.push({
                role: `user`,
                content: msg,
            })
            let { response, newMessages } = await GPT4Client.ask(messages)

            user.gpt4s.messages = messages;
            txt = response;
        }

    } else
    if (ai == '/chatgpt') {

        let messages = user.chatgpt.messages;
        messages.push({
            role: `user`,
            content: msg,
        })
        let { response, newMessages } = await ChatGPTClient.ask(messages)

        user.chatgpt.messages = messages;
        txt = response;

    } else
    if (ai == '/chatgpt+sydney') {

        if (user.chatgpts.messages.length == 0) {
            let messages = [
                {
                    role: `system`,
                    content: njb
                },
                {
                    role: `user`,
                    content: msg
                }
            ];
            let { response, newMessages } = await ChatGPTClient.ask(messages)

            user.chatgpts.messages = messages;
            txt = response;
        } else {
            let messages = user.chatgpts.messages;
            messages.push({
                role: `user`,
                content: msg,
            })
            let { response, newMessages } = await ChatGPTClient.ask(messages)

            user.chatgpts.messages = messages;
            txt = response;
        }
    }

    if (txt != ``) {
        await ctx.reply(txt, {
            reply_to_message_id: ctx.message.message_id 
        });
    };

}

async function solve(ctx) {
    const userId = ctx.from.id;
    
    if (!context[userId]) {
      const replyMessage = 'Похоже у тебя ещё нет диалога. Ты его можешь создать при помощи /new';
      await ctx.reply(replyMessage, { reply_to_message_id: ctx.message.message_id });
      return;
    }
    
    const { username, first_name, last_name, chat } = ctx.message.from;
    const { aiback } = context[userId];
    const { text, message_id } = ctx.message;
  
    const bot_tmp = await ctx.reply('*Waiting*', {
      reply_to_message_id: message_id,
      parse_mode: 'MarkdownV2'
    });
  
    msgOneTime++;
  
    const logMessage = `@${username} (${first_name} ${last_name}, Private) ask ${aiback}. RPS: ${rps} THREADS: ${msgOneTime + 1}`;
    console.log(logMessage);
  
    let response = null;
    let r = null;
  
    await bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  
    try {
      const generateFunction = aiback === 'openai' ? generate_gpt : aiback === 'gpt4' ? generate_gpt4 : generate;
      const { response: qResponse, r: qR } = await generateFunction(userId, response, text, new Date(), new Date(), bot_tmp);
      response = qResponse;
      r = qR;
    } catch (error) {
      await errorCatch(error, userId, bot_tmp);
      return;
    }
  
    const out = response?.response ?? r;
    const kb = response?.details?.suggestedResponses?.map(i => [i.text]) ?? [];
    kb.push(['/new']);
  
    if (!response?.iser) {
      try {
        await ctx.deleteMessage(bot_tmp.message_id);
        const replyMarkup = {
          keyboard: kb,
          one_time_keyboard: true,
          resize_keyboard: true
        };
        await ctx.reply(r || out, { reply_markup: replyMarkup, reply_to_message_id: ctx.message.message_id });
      } catch (error) {}
    }
  
    msgOneTime--;
  
    await generateImg(r, userId, ctx);
}
  
function gptUpdate(end, start, r, token, oldr, userId, bot_tmp) {
    end = new Date();
    let timeDiff = end - start;
    r += token;
    if (r.trim() != oldr.trim() && timeDiff > Update) {
        try {
            bot.telegram.editMessageText(userId, bot_tmp.message_id, null, `${r} ▋`);
        } catch (error) {
            console.log(error);
        }
        start = new Date();
    }
    oldr = r;
    return { end, start, r, oldr };
}

async function generate_gpt(userId, response, text, end, start, bot_tmp) {
    let oldr = '';
    let r = '';

    const tokenHandler = (token) => {
        ({ end, start, r, oldr } = gptUpdate(end, start, r, token, oldr, userId, bot_tmp));
    };

    if (context[userId].lastResponse == null) {
        response = await first_ask_gpt(text, context[userId].jailbreak, context[userId].tone, context[userId].prompt, tokenHandler);
        context[userId].lastResponse = response;
    } else {
        response = await ask_gpt(text, context[userId].lastResponse, tokenHandler);
    }
    return {
        response: response,
        r: r
    };
}

async function generate_gpt4(userId, response, text, end, start, bot_tmp) {
    let oldr = '';
    let r = '';

    const tokenHandler = (token) => {
        ({ end, start, r, oldr } = gptUpdate(end, start, r, token, oldr, userId, bot_tmp));
    };

    if (context[userId].lastResponse == null) {
        response = await first_ask_gpt4(text, context[userId].jailbreak, context[userId].tone, context[userId].prompt, tokenHandler);
        context[userId].lastResponse = response;
    } else {
        response = await ask_gpt4(text, context[userId].lastResponse, tokenHandler);
    }
    return {
        response: response,
        r: r
    };
}

async function generate(userId, response, text, end, start, bot_tmp) {
    let oldr = '';
    let r = '';

    const tokenHandler = (token) => {
        ({ end, start, r, oldr } = gptUpdate(end, start, r, token, oldr, userId, bot_tmp));
    };

    if (context[userId].lastResponse == null) {
        response = await first_ask(text, context[userId].jailbreak, context[userId].tone, context[userId].prompt, tokenHandler);
        context[userId].lastResponse = response;
    } else {
        response = await ask(text, context[userId].lastResponse, tokenHandler);
    }
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


