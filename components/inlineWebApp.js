require("dotenv").config();

function inlineWebApp() {
  const url = process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/";

  return {
    inline_keyboard: [
      [
        {
          text: "Открыть офис",
          web_app: { url },
        },
      ],
    ],
  };
}

module.exports = { inlineWebApp };
