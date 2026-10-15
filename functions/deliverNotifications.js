const { inlineWebApp } = require("../components/inlineWebApp");

require("dotenv").config();

let lastNotifyError = "";

async function deliverNotifications(bot) {
  const url = process.env.LEAD_API_URL || "https://cursivalead.cursiva-dev.ru/api.php";
  const secret = process.env.BOT_SECRET || "";
  if (!secret) return;

  let payload;

  try {
    const response = await fetch(`${url}?action=notify_pending`, {
      headers: { "X-Bot-Secret": secret },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return;
    payload = await response.json();
  } catch (error) {
    const message = String(error.message || error);
    if (message !== lastNotifyError) {
      lastNotifyError = message;
      console.log(message);
    }
    return;
  }

  lastNotifyError = "";

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) return;

  const done = [];

  for (const item of items) {
    try {
      await bot.sendMessage(item.chat_id, item.text, {
        disable_web_page_preview: true,
        reply_markup: inlineWebApp(Number(item.chat_id) < 0 ? "supergroup" : "private", item.page || undefined),
      });
      done.push(item.id);
    } catch (error) {
      const description = String(error.message || error);
      console.log(description);
      if (/blocked|chat not found|deactivated|kicked|not enough rights/i.test(description)) {
        done.push(item.id);
      }
    }
  }

  if (!done.length) return;

  try {
    await fetch(`${url}?action=notify_ack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": secret,
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ ids: done }),
    });
  } catch (error) {
    console.log(error.message || error);
  }
}

module.exports = { deliverNotifications };
