const { replyKeyboard } = require("../components/replyKeyboard");
const { inlineWebApp } = require("../components/inlineWebApp");

async function handleWebApp(bot, msg) {
  const chatId = msg.chat.id;
  const text = `Заявки Cursiva

Когда на cursiva.ru оставляют заявку, сообщение приходит сюда.
«Открыть заявки» ниже открывает список. «Заявки» слева от поля ввода делает то же самое.

Текстом: /leads, /status 12 в работе, /note 12 текст.`;

  const markup = msg.chat.type === "private"
    ? { reply_markup: replyKeyboard() }
    : { reply_markup: inlineWebApp() };

  await bot.sendMessage(chatId, text, markup);
  if (msg.chat.type === "private") {
    await bot.sendMessage(chatId, "Список заявок", {
      reply_markup: inlineWebApp(),
    });
  }
}

module.exports = { handleWebApp };
