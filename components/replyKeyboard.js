function replyKeyboard(chatType) {
  const inGroup = chatType && chatType !== "private";
  return {
    keyboard: inGroup
      ? [[{ text: "/leads" }, { text: "/office" }], [{ text: "/help" }]]
      : [[{ text: "Заявки" }, { text: "Офис" }], [{ text: "Помощь" }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

module.exports = { replyKeyboard };
