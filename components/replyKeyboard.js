const { webButton } = require("./webButton");

function replyKeyboard() {
  const cabinet = webButton()[0][0];

  return {
    keyboard: [
      [{ text: cabinet.text, web_app: cabinet.web_app }],
      [{ text: "Помощь" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

module.exports = { replyKeyboard };
