function replyKeyboard() {
  return {
    keyboard: [
      [{ text: "Заявки" }, { text: "Помощь" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

module.exports = { replyKeyboard };
