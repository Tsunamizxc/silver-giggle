const { replyKeyboard } = require("../components/replyKeyboard");

async function handleWebApp(bot, msg, siteReady) {
  const chatId = msg.chat.id;
  const readyText = siteReady
    ? "Когда на cursiva.ru оставляют заявку, сюда приходит сообщение. Список и статусы — в «Открыть заявки»."
    : "Меню уже здесь. Список откроется после загрузки сайта cursivalead.cursiva-dev.ru. Когда сайт будет доступен, бот напишет сам.";

  await bot.sendMessage(chatId, `Заявки Cursiva\n\n${readyText}`, {
    reply_markup: replyKeyboard(),
  });
}

module.exports = { handleWebApp };
