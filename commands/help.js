const { replyKeyboard } = require("../components/replyKeyboard");

async function helpCommand(bot, msg) {
  const chatId = msg.chat.id;
  const text = `Как устроены заявки

Человек отправляет форму на cursiva.ru — сообщение приходит в этот чат.
«Открыть заявки» показывает список.

Статусы: активный, в работе, закрыт, отменен.

Команды:
/start — открыть меню
/help — эта подсказка`;

  await bot.sendMessage(chatId, text, {
    reply_markup: replyKeyboard(),
  });
}

module.exports = { helpCommand };
