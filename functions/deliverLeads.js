const { removeManager } = require("./registerManager");

require("dotenv").config();

let lastDeliveryError = "";

async function deliverPending(bot) {
  const url = process.env.LEAD_API_URL || "https://cursivalead.cursiva-dev.ru/api.php";
  const secret = process.env.BOT_SECRET || "";
  if (!secret) return;

  let payload;

  try {
    const response = await fetch(`${url}?action=pending`, {
      headers: { "X-Bot-Secret": secret },
    });
    if (!response.ok) return;
    payload = await response.json();
  } catch (error) {
    const message = String(error.message || error);
    if (message !== lastDeliveryError) {
      lastDeliveryError = message;
      console.log(message);
    }
    return;
  }

  lastDeliveryError = "";

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) return;

  const sentIds = [];

  for (const item of items) {
    const targets = Array.isArray(item.chats) ? item.chats : [];
    let delivered = false;

    for (const chat of targets) {
      try {
        await bot.sendMessage(chat.chat_id, item.text, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: item.reply_markup || undefined,
        });
        delivered = true;
      } catch (error) {
        const description = String(error.message || error);
        console.log(description);
        if (/blocked|chat not found|deactivated/i.test(description)) {
          await removeManager(chat.telegram_id);
        }
      }
    }

    if (delivered) sentIds.push(item.id);
  }

  if (!sentIds.length) return;

  try {
    await fetch(`${url}?action=ack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": secret,
      },
      body: JSON.stringify({ ids: sentIds }),
    });
  } catch (error) {
    console.log(error.message || error);
  }
}

module.exports = { deliverPending };
