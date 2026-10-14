const fs = require("fs");
const path = require("path");

require("dotenv").config();

const file = path.join(__dirname, "..", "data", "managers.json");

function personFrom(msg) {
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ");

  return {
    telegram_id: from.id,
    chat_id: msg.chat.id,
    name,
    announced: false,
  };
}

function readQueue() {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeQueue(items) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(items));
}

async function postManager(person) {
  const url = process.env.LEAD_API_URL || "https://cursivalead.cursiva-dev.ru/api.php";
  const secret = process.env.BOT_SECRET || "";

  if (!secret) return false;

  try {
    const response = await fetch(`${url}?action=manager`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": secret,
      },
      body: JSON.stringify({
        telegram_id: person.telegram_id,
        chat_id: person.chat_id,
        name: person.name,
      }),
    });

    return response.ok;
  } catch (error) {
    console.log(error.message || error);
    return false;
  }
}

async function registerNow(msg) {
  const person = personFrom(msg);
  if (!person.telegram_id) return false;

  const ok = await postManager(person);
  if (ok) return true;

  const queue = readQueue().filter((item) => item.telegram_id !== person.telegram_id);
  queue.push(person);
  writeQueue(queue);
  return false;
}

async function flushManagers(bot) {
  const queue = readQueue();
  if (!queue.length) return;

  const left = [];

  for (const person of queue) {
    const ok = await postManager(person);
    if (!ok) {
      left.push(person);
      continue;
    }

    if (!person.announced && bot) {
      try {
        await bot.sendMessage(
          person.chat_id,
          "Доступ к заявкам открыт. Можно нажать «Открыть заявки»."
        );
      } catch (error) {
        console.log(error.message || error);
      }
    }
  }

  writeQueue(left);
}

async function removeManager(telegramId) {
  const url = process.env.LEAD_API_URL || "https://cursivalead.cursiva-dev.ru/api.php";
  const secret = process.env.BOT_SECRET || "";
  if (!secret) return;

  try {
    await fetch(`${url}?action=manager_remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": secret,
      },
      body: JSON.stringify({ telegram_id: telegramId }),
    });
  } catch (error) {
    console.log(error.message || error);
  }
}

module.exports = { registerNow, flushManagers, removeManager };
