const { handleMessage } = require("./functions/handleMessage");
const { deliverPending } = require("./functions/deliverLeads");
const { flushManagers } = require("./functions/registerManager");

require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log("В .env нет TELEGRAM_BOT_TOKEN.");
  process.exit(1);
}

startBot(token);

function startBot(botToken) {
  const TelegramBot = require("node-telegram-bot-api");
  const bot = new TelegramBot(botToken, { polling: true });

  function paintButton(button) {
    if (!button || button.style || button.request_contact) {
      return button;
    }
    return { ...button, style: "primary" };
  }

  function paintMarkup(markup) {
    if (!markup || !Array.isArray(markup.keyboard)) {
      return markup;
    }

    return {
      ...markup,
      keyboard: markup.keyboard.map((row) => row.map(paintButton)),
    };
  }

  const sendMessage = bot.sendMessage.bind(bot);

  bot.sendMessage = (chatId, text, options = {}) => {
    if (options.reply_markup) {
      options = { ...options, reply_markup: paintMarkup(options.reply_markup) };
    }
    return sendMessage(chatId, text, options);
  };

  bot.setMyCommands([
    { command: "start", description: "Открыть заявки" },
    { command: "help", description: "Как это работает" },
  ]).catch((error) => console.log(error));

  const webAppUrl = process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/";

  async function setMenuButton() {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menu_button: {
              type: "web_app",
              text: "Заявки",
              web_app: { url: webAppUrl },
            },
          }),
        });
        if (response.ok) return;
      } catch (error) {
        console.log(error.message || error);
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  }

  setMenuButton();

  bot.on("message", async (msg) => {
    try {
      await handleMessage(bot, msg);
    } catch (error) {
      console.log(error);
    }
  });

  bot.on("polling_error", (error) => {
    console.log(error.message || error);
  });

  let busy = false;

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      await flushManagers(bot);
      await deliverPending(bot);
    } catch (error) {
      console.log(error);
    } finally {
      busy = false;
    }
  }

  setTimeout(tick, 5000);
  setInterval(tick, 15000);

  console.log("Бот заявок Cursiva запущен.");
}
