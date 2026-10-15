require("dotenv").config();

const botName = process.env.BOT_USERNAME || "cursivalead_bot";
const webAppUrl = process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/";

function startAppLink(page) {
  return `https://t.me/${botName}?startapp${page ? `=${page}` : ""}`;
}

function pageUrl(page) {
  const base = webAppUrl.endsWith("/") ? webAppUrl : `${webAppUrl}/`;
  if (page === "finance") return `${base}finance/`;
  if (page === "tasks") return `${base}?page=tasks`;
  return base;
}

function groupMenu() {
  return {
    inline_keyboard: [
      [
        { text: "Заявки", callback_data: "leads" },
        { text: "Задачи", callback_data: "tasks" },
      ],
      [
        { text: "Финансы", callback_data: "money" },
        { text: "Помощь", callback_data: "help" },
      ],
      [{ text: "Открыть офис", url: startAppLink() }],
    ],
  };
}

function inlineWebApp(chatType, page) {
  if (chatType && chatType !== "private") {
    if (!page) return groupMenu();
    return { inline_keyboard: [[{ text: openLabel(page), url: startAppLink(page) }]] };
  }

  return {
    inline_keyboard: [[{ text: openLabel(page), web_app: { url: pageUrl(page) } }]],
  };
}

function openLabel(page) {
  if (page === "finance") return "Открыть финансы";
  if (page === "tasks") return "Открыть задачи";
  return "Открыть офис";
}

module.exports = { inlineWebApp, groupMenu, startAppLink };
