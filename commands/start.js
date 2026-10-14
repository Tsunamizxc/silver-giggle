const { handleWebApp } = require("../functions/handleWebApp");
const { registerNow } = require("../functions/registerManager");

async function startCommand(bot, msg) {
  const state = await registerNow(msg);
  if (state === "denied") {
    await bot.sendMessage(msg.chat.id, "Нет доступа. Бот открыт только для команды Cursiva.");
    return;
  }
  if (state === "later") {
    await bot.sendMessage(msg.chat.id, "Сайт заявок сейчас не отвечает. Напишите /start ещё раз чуть позже.");
    return;
  }
  await handleWebApp(bot, msg);
}

module.exports = { startCommand };
