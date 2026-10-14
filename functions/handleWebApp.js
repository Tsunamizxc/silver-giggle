const { replyKeyboard } = require("../components/replyKeyboard");
const { inlineWebApp } = require("../components/inlineWebApp");

async function handleWebApp(bot, msg) {
  const chatId = msg.chat.id;
  const text = `Офис Cursiva

Заявки, задачи и деньги хранятся в базе. «Открыть офис» ниже открывает приложение, слева от поля ввода кнопка «Офис».

Текстом: /new Иван 79991234567 сайт, /task купить домен, /income 15000 оплата, /expense 3000 реклама.`;

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
