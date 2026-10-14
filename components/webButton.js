require("dotenv").config();

function webButton() {
  const url = process.env.WEB_APP_URL || "https://cursivalead.cursiva-dev.ru/";

  return [
    [
      {
        text: "Открыть заявки",
        web_app: { url },
      },
    ],
  ];
}

module.exports = { webButton };
