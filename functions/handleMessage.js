const { helpCommand } = require("../commands/help");
const { startCommand } = require("../commands/start");

const commandHandlers = new Map([
  ["/start", startCommand],
  ["/help", helpCommand],
]);

const buttonHandlers = new Map([["Помощь", helpCommand]]);

async function handleMessage(bot, msg) {
  const text = msg.text || "";
  const command = text.split("@")[0];
  const handler = commandHandlers.get(command) || buttonHandlers.get(text);

  if (handler) {
    await handler(bot, msg);
    return;
  }

  if (text) {
    await bot.sendMessage(msg.chat.id, "Напишите /start, чтобы открыть заявки.");
  }
}

module.exports = { handleMessage };
