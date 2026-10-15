require("dotenv").config();

const botName = process.env.BOT_USERNAME || "cursivalead_bot";
const webAppUrl = process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/";
let mainApp = false;

function setMainApp(value) {
  mainApp = !!value;
}

function mainAppEnabled() {
  return mainApp;
}

function officeLink(page) {
  if (mainApp) return `https://t.me/${botName}?startapp${page ? `=${page}` : ""}`;
  return `https://t.me/${botName}?start=${page || "office"}`;
}

function pageUrl(page) {
  const base = webAppUrl.endsWith("/") ? webAppUrl : `${webAppUrl}/`;
  return page ? `${base}?page=${page}` : base;
}

function openLabel(page) {
  if (page === "finance") return "Открыть финансы";
  if (page === "tasks") return "Открыть задачи";
  return "Открыть офис";
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
      [{ text: "Открыть офис", url: officeLink() }],
    ],
  };
}

function inlineWebApp(chatType, page) {
  if (chatType && chatType !== "private") {
    if (!page) return groupMenu();
    return { inline_keyboard: [[{ text: openLabel(page), url: officeLink(page) }]] };
  }

  return {
    inline_keyboard: [[{ text: openLabel(page), web_app: { url: pageUrl(page) } }]],
  };
}

module.exports = { inlineWebApp, groupMenu, officeLink, setMainApp, mainAppEnabled };
