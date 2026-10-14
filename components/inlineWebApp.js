require("dotenv").config();

function inlineWebApp(chatType) {
  const inGroup = chatType && chatType !== "private";
  const button = inGroup
    ? { text: "Открыть офис", url: "https://t.me/cursivalead_bot?startapp" }
    : {
        text: "Открыть офис",
        web_app: { url: process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/" },
      };

  return { inline_keyboard: [[button]] };
}

module.exports = { inlineWebApp };
