const fs = require("fs");
const path = require("path");
const { api } = require("./api");

const file = path.join(__dirname, "..", "data", "managers.json");

function personFrom(msg) {
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
  const kind = msg.chat && msg.chat.type === "private" ? "private" : "group";

  return {
    telegram_id: from.id,
    chat_id: msg.chat.id,
    name,
    kind,
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

async function postSession(person) {
  try {
    const result = await api("session", {
      method: "POST",
      body: {
        telegram_id: person.telegram_id,
        chat_id: person.chat_id,
        name: person.name,
        kind: person.kind || "private",
      },
    });
    if (result.status === 403) return "denied";
    if (result.ok && result.payload.ok) return "ok";
    return "later";
  } catch (error) {
    console.log(error.message || error);
    return "later";
  }
}

async function registerNow(msg) {
  const person = personFrom(msg);
  if (!person.telegram_id) return "later";

  const state = await postSession(person);
  if (state === "ok" || state === "denied") {
    const queue = readQueue().filter((item) => item.telegram_id !== person.telegram_id);
    writeQueue(queue);
    return state;
  }

  const queue = readQueue().filter((item) => item.telegram_id !== person.telegram_id);
  queue.push(person);
  writeQueue(queue);
  return "later";
}

async function flushManagers(bot) {
  const queue = readQueue();
  if (!queue.length) return;

  const left = [];
  for (const person of queue) {
    const state = await postSession(person);
    if (state === "later") {
      left.push(person);
      continue;
    }
    if (state === "ok" && !person.announced && bot) {
      try {
        await bot.sendMessage(person.chat_id, "Доступ к заявкам открыт. Нажмите /start.");
      } catch (error) {
        console.log(error.message || error);
      }
    }
  }

  writeQueue(left);
}

async function removeManager(telegramId) {
  try {
    await api("chat_remove", {
      method: "POST",
      body: { chat_id: telegramId },
    });
  } catch (error) {
    console.log(error.message || error);
  }
}

module.exports = { registerNow, flushManagers, removeManager, personFrom };
