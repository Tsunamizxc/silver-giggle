const { handleButton, handleMembership, handleMessage } = require("./functions/handleMessage");
const { deliverPending } = require("./functions/deliverLeads");
const { deliverNotifications } = require("./functions/deliverNotifications");
const { flushManagers } = require("./functions/registerManager");
const { api } = require("./functions/api");
const { setMainApp } = require("./components/inlineWebApp");

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
    if (!button || button.style || button.web_app || button.request_contact) {
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

  const commands = [
    { command: "start", description: "Открыть меню" },
    { command: "leads", description: "Последние заявки" },
    { command: "new", description: "Новая заявка вручную" },
    { command: "task", description: "Добавить задачу" },
    { command: "tasks", description: "Открытые задачи" },
    { command: "done", description: "Отметить задачу сделанной" },
    { command: "income", description: "Записать доход" },
    { command: "expense", description: "Записать расход" },
    { command: "office", description: "Открыть офис" },
    { command: "money", description: "Финансы: выручка, расходы, прибыль" },
    { command: "menu", description: "Меню кнопками" },
    { command: "help", description: "Команды" },
  ];
  bot.setMyCommands(commands).catch((error) => console.log(error));
  bot.setMyCommands(commands, { scope: { type: "all_group_chats" } }).catch((error) => console.log(error));

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
              text: "Офис",
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

  async function checkMainApp() {
    try {
      const me = await bot.getMe();
      setMainApp(me.has_main_web_app);
    } catch (error) {
      console.log(error.message || error);
    }
  }

  checkMainApp();
  setInterval(checkMainApp, 10 * 60 * 1000);

  bot.on("message", async (msg) => {
    try {
      await handleMessage(bot, msg);
    } catch (error) {
      console.log(error);
    }
  });

  bot.on("callback_query", async (query) => {
    try {
      await handleButton(bot, query);
    } catch (error) {
      console.log(error);
    }
  });

  bot.on("my_chat_member", async (update) => {
    try {
      await handleMembership(bot, update);
    } catch (error) {
      console.log(error);
    }
  });

  bot.on("polling_error", (error) => {
    console.log(error.message || error);
  });

  let busy = false;
  let ownerReady = false;

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const ownerId = Number(process.env.OWNER_ID || 0);
      if (ownerId && !ownerReady) {
        const ready = await api("bootstrap", { method: "POST", body: { owner_id: ownerId, name: "" } });
        ownerReady = !!(ready.ok && ready.payload && ready.payload.ok);
      }
      await flushManagers(bot);
      await deliverPending(bot);
      await deliverNotifications(bot);
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
