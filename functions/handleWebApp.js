const { replyKeyboard } = require("../components/replyKeyboard");
const { inlineWebApp } = require("../components/inlineWebApp");

async function handleWebApp(bot, msg) {
  const chatId = msg.chat.id;
  const text = `Офис Cursiva

Заявки, задачи и деньги хранятся в базе. «Открыть офис» ниже открывает приложение, слева от поля ввода кнопка «Офис».

Текстом: /new Иван 79991234567 сайт, /task купить домен, /income 15000 оплата, /expense 3000 реклама.`;

  await bot.sendMessage(chatId, text, {
    reply_markup: replyKeyboard(msg.chat.type),
  });
  await bot.sendMessage(chatId, "Открыть офис", {
    disable_web_page_preview: true,
    reply_markup: inlineWebApp(msg.chat.type),
  });
}

module.exports = { handleWebApp };
