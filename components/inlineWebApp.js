require("dotenv").config();

const officeLink = "https://t.me/cursivalead_bot?start=office";

function groupMenu() {
  return {
    inline_keyboard: [
      [
        { text: "Заявки", callback_data: "leads" },
        { text: "Задачи", callback_data: "tasks" },
      ],
      [
        { text: "Деньги", callback_data: "money" },
        { text: "Помощь", callback_data: "help" },
      ],
      [{ text: "Открыть офис", url: officeLink }],
    ],
  };
}

function inlineWebApp(chatType) {
  if (chatType && chatType !== "private") return groupMenu();

  return {
    inline_keyboard: [
      [
        {
          text: "Открыть офис",
          web_app: { url: process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/" },
        },
      ],
    ],
  };
}

module.exports = { inlineWebApp, groupMenu };
