const { Telegraf, Markup, Scenes, session } = require('telegraf');
const { JsonBase, User, Users } = require('./tools.js')
const times = require('./times');
const { stat } = require('fs');

const users = new JsonBase('users', [], './database')

const invite_link = 'https://t.me/+jM9wx24WlD9lZDRi',
    workSchedule = [
        [ "Понедельник", 8, 00,   23, 00],
        [ "Вторник", 8, 00,   23, 00 ],
        [ "Среда", 8, 00,   23, 00],
        [ "Четверг", 8, 00,   23, 00 ], 
        [ "Пятница", 8, 00,   23, 00 ],
        [ "Суббота", 8, 00, 23, 00 ], 
        [ "Воскресенье", 8, 00, 23, 00 ]
    ] // 10:00 - 15:30 -> [ DayName, 10, 00,   15, 30 ]
    // Выходной -> [ DayName, false ]

const timeWork = workSchedule.map(x => `${x[0]}: ${x[1] ? x[1].toString().padStart(2, '0')+":"+x[2].toString().padStart(2, '0')+" - "+x[3].toString().padStart(2, '0')+":"+x[4].toString().padStart(2, '0') : "Выходной"}`).join('\n');

const bot = new Telegraf('6270041255:AAH_eXT7YqfwUD76ZCbAINW9D0S6ZgJ5Bzk')

const loadLib = (name) => {
    const path = `./${name}`;
    const result = require(path)(bot.context);
    if (result) bot.context[name] = result;
}

loadLib('context')

const start = new Scenes.WizardScene('start',
    async (ctx) => {
        ctx.session.user = {}
        ctx.send('Отправьте Ваше имя:')
        return ctx.wizard.next()
    },
    async (ctx) => {
        if (/^[a-zA-Zа-яА-Я]+$/i.test(ctx.message.text)) {
            ctx.session.user.name = ctx.message.text
            await ctx.send(`Отправленное Вами имя: ${ctx.message.text}`)
            await ctx.send('Отправьте Вашу фамилию:')
            return ctx.wizard.next()
        }
        ctx.send('Имя должно содержать только буквы!\nПопробуйте снова.')
    },
    async (ctx) => {
        if (/^[a-zA-Zа-яА-Я]+$/i.test(ctx.message.text)) {
            ctx.session.user.surname = ctx.message.text
            await ctx.send(`Отправленная Вами фамилия: ${ctx.message.text}`)
            await ctx.send('Отправьте Вашу сферу деятельности:')
            return ctx.wizard.next()
        }
        ctx.send('Имя должно содержать только буквы!\nПопробуйте снова.')
    },
    async (ctx) => {
        if (ctx.message.text) {
            ctx.session.user.job = ctx.message.text
            await ctx.send(`Отправленная Вами сфера деятельности: ${ctx.message.text}`)
            await ctx.send('Отправьте Ваш номер телефона:')
            return ctx.wizard.next()
        }
        ctx.send('Вы должны отравить только текст!\nПопробуйте снова.')
    }, 
    async (ctx) => {
        if (ctx.message.text) {
            ctx.session.user.phone = ctx.message.text
            await ctx.send(`Отправленный Вами номер телефона: ${ctx.message.text}`)
            await ctx.send('Отправьте Вашу электронную почту:')
            return ctx.wizard.next()
        }
    },
    async (ctx) => {
        if (ctx.message.text) {
            ctx.session.user.mail = ctx.message.text
            await ctx.send(`Отправленная Вами электронная почта: ${ctx.message.text}`)
            await ctx.send('Отправьте ссылки на ваши соц.сети или сайт\nОдним сообщением:')
            return ctx.wizard.next()
        }
    },
    async (ctx) => {
        if (ctx.message.text) {
            ctx.session.user.sites = ctx.message.text
            await await ctx.send(`Отправленные вами ссылки на соц.сети или сайт:\n${ctx.message.text}`)
            await ctx.telegram.restrictChatMember(ctx.session.chatId, ctx.from.id, {
                permissions: {
                  can_send_messages: true,
                  can_send_media_messages: true,
                  can_send_polls: true,
                  can_send_other_messages: true,
                },
            })
            await ctx.send('Вы успешно прошли проверку, Вам была выдана возможность писать в группу!', Markup
                .inlineKeyboard([
                    [Markup.button.url('Перейти в чат', invite_link)]
                ])
            )
            ctx.session.user.id = ctx.from.id
            users.body.push(ctx.session.user)
            users.save()
            return ctx.scene.leave()
        }
    }
)

const stage = new Scenes.Stage([ start ])

bot
.use(session())
.use(stage.middleware())
.use((ctx, next) => {
  ctx.session ??= {}
  return next()
})

bot
.start(async ctx => {
    if (ctx.message.text != '/start') {
        const user = users.body.find(x => x.id == ctx.from.id)
        if (!user) {
            ctx.session.chatId = ctx.message.text.replace(" ", "").split("/start")[1]
            return ctx.scene.enter('start')
        }
        return ctx.reply('Вы уже есть в базе данных!')
    }
})

bot
.on('message', async ctx => {
    const user = users.body.find(x => x.id == ctx.from.id)
    console.log(isTimeWork());
    if (!isTimeWork()) {
        if (ctx.chat.type == 'group' || ctx.chat.type == 'supergroup') {
            try {
                ctx.deleteMessage(ctx.message.message_id)
                return ctx.telegram.sendMessage(ctx.from.id, `Извините сейчас не рабочее время!\nГрафик работы:\n${timeWork}`)
            } catch (e) { console.log(e) }
        }
    }
    else {
        if (ctx.chat.type == 'group' || ctx.chat.type == 'supergroup') {
            const { status } = await ctx.getChatMember(ctx.from.id)
            console.log(status)
            if (!user && status != 'restricted') {
                try {
                    ctx.telegram.restrictChatMember(ctx.chat.id, ctx.from.id, {
                        permissions: {
                          can_send_messages: false,
                          can_send_media_messages: false,
                          can_send_polls: false,
                          can_send_other_messages: false,
                            },
                    })
                    return sendCheck(ctx)
                } catch (e) { console.log(e) }
            }
        }
    }
})
.on('new_chat_members', async ctx => {
    try {
        ctx.telegram.restrictChatMember(ctx.chat.id, ctx.from.id, {
            permissions: {
              can_send_messages: false,
              can_send_media_messages: false,
              can_send_polls: false,
              can_send_other_messages: false,
            },
        })
        return sendCheck(ctx)
    } catch (e) { console.log(e) }
    return sendCheck(ctx)
})

bot
.launch({dropPendingUpdates: true})
.then(console.log('Бот запущен!'))

const sendCheck = (ctx) => {
    ctx.send(`Привет, ${ctx.genMention()}\nВы находитесь сейчас в режиме только-чтение, чтобы писать в чат пройдите проверку. Нажмите кнопку внизу сообщения, чтобы начать проверку.`, Markup
        .inlineKeyboard([
            [Markup.button.url('Пройти проверку', `https://t.me/${ctx.botInfo.username}?start=${ctx.chat.id}`)]
        ])
    )
}

function isTimeWork(){
	const date = new Date();
	const day = workSchedule[ date.getUTCDay() - 1],
		minutes = date.getUTCMinutes() + date.getUTCHours() * 60;
	console.log(`Now: ${day[0]}. ${minutes}. ${day}`)
	return ( day[1] && minutes >= day[1] * 60 + day[2]
			&& minutes <= day[3] * 60 + day[4])
}