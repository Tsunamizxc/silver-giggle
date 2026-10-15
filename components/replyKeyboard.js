function replyKeyboard(chatType) {
  if (chatType && chatType !== "private") {
    return { remove_keyboard: true };
  }

  return {
    keyboard: [
      [{ text: "Заявки" }, { text: "Офис" }],
      [{ text: "Помощь" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

module.exports = { replyKeyboard };
