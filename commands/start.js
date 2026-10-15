const { handleWebApp } = require("../functions/handleWebApp");
const { registerNow } = require("../functions/registerManager");
const { inlineWebApp } = require("../components/inlineWebApp");
const { replyKeyboard } = require("../components/replyKeyboard");

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
  const payload = String(msg.text || "").trim().split(/\s+/)[1] || "";
  const pages = { office: "", tasks: "tasks", finance: "finance" };
  if (payload in pages && msg.chat.type === "private") {
    await bot.sendMessage(msg.chat.id, "Офис Cursiva", {
      reply_markup: replyKeyboard(msg.chat.type),
    });
    await bot.sendMessage(msg.chat.id, "Нажмите, чтобы открыть заявки, задачи и финансы.", {
      reply_markup: inlineWebApp(msg.chat.type, pages[payload]),
    });
    return;
  }
  await handleWebApp(bot, msg);
}

module.exports = { startCommand };
