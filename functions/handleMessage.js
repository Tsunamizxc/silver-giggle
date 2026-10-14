const { startCommand } = require("../commands/start");
const { helpText, sendLeads, setLeadStatus, setLeadNote, listUsers, changeUser } = require("../commands/text");
const { openOffice, createLead, createTask, listTasks, completeTask, addMoney } = require("../commands/office");
const { api } = require("./api");

function commandParts(text) {
  const parts = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { command: "", args: [] };
  parts[0] = parts[0].split("@")[0].toLowerCase();
  return { command: parts[0], args: parts.slice(1) };
}

async function handleMessage(bot, msg) {
  const text = msg.text || "";
  if (!text) return;

  const { command, args } = commandParts(text);
  const aliases = {
    "/start": "start",
    "/help": "help",
    "/leads": "leads",
    "/status": "status",
    "/note": "note",
    "/users": "users",
    "/allow": "allow",
    "/deny": "deny",
    "/new": "new",
    "/task": "task",
    "/tasks": "tasks",
    "/done": "done",
    "/income": "income",
    "/expense": "expense",
    "заявки": "leads",
    "офис": "office",
    "помощь": "help",
  };
  const action = aliases[command];

  if (msg.chat.type !== "private" && !action) return;

  let allowed = false;
  let siteDown = false;
  try {
    const result = await api("users");
    if (!result.ok) siteDown = true;
    else allowed = (result.payload.users || []).some((user) => user.telegram_id === (msg.from && msg.from.id));
  } catch (error) {
    siteDown = true;
    console.log(error.message || error);
  }

  if (siteDown) {
    if (msg.chat.type === "private") {
      await bot.sendMessage(msg.chat.id, "Сайт заявок сейчас не отвечает. Напишите ещё раз через минуту.");
    }
    return;
  }

  const ownerId = Number(process.env.OWNER_ID || 0);
  if (!allowed && ownerId && msg.from && Number(msg.from.id) === ownerId) {
    await api("bootstrap", { method: "POST", body: { owner_id: ownerId, name: "" } });
    allowed = true;
  }

  if (!allowed) {
    if (msg.chat.type === "private" || action) {
      await bot.sendMessage(msg.chat.id, "Нет доступа. Бот открыт только для команды Cursiva.");
    }
    return;
  }

  if (action === "start") {
    await startCommand(bot, msg);
    return;
  }
  if (action === "help") {
    await helpText(bot, msg);
    return;
  }
  if (action === "leads") {
    await sendLeads(bot, msg);
    return;
  }
  if (action === "status") {
    await setLeadStatus(bot, msg, args);
    return;
  }
  if (action === "note") {
    await setLeadNote(bot, msg, args);
    return;
  }
  if (action === "users") {
    await listUsers(bot, msg);
    return;
  }
  if (action === "allow" || action === "deny") {
    await changeUser(bot, msg, args, action === "allow");
    return;
  }
  if (action === "office") {
    await openOffice(bot, msg);
    return;
  }
  if (action === "new") {
    await createLead(bot, msg, args);
    return;
  }
  if (action === "task") {
    await createTask(bot, msg, args);
    return;
  }
  if (action === "tasks") {
    await listTasks(bot, msg);
    return;
  }
  if (action === "done") {
    await completeTask(bot, msg, args);
    return;
  }
  if (action === "income" || action === "expense") {
    await addMoney(bot, msg, args, action);
    return;
  }

  if (msg.chat.type === "private") {
    await bot.sendMessage(msg.chat.id, "Напишите /leads, /help или /start.");
  }
}

async function handleMembership(bot, update) {
  const chat = update.chat;
  const from = update.from || {};
  const next = update.new_chat_member || {};
  const status = next.status || "";
  if (!chat || chat.type === "private") return;

  if (status === "left" || status === "kicked") {
    try {
      await api("chat_remove", { method: "POST", body: { chat_id: chat.id } });
    } catch (error) {
      console.log(error.message || error);
    }
    return;
  }

  if (status !== "member" && status !== "administrator") return;

  const ownerId = Number(process.env.OWNER_ID || 0);
  if (ownerId && Number(from.id) === ownerId) {
    await api("bootstrap", { method: "POST", body: { owner_id: ownerId, name: "" } });
  }

  const users = await api("users");
  const allowed = (users.payload.users || []).some((user) => user.telegram_id === from.id);
  if (!allowed) {
    try {
      await bot.sendMessage(chat.id, "Бот доступен только команде Cursiva.");
      await bot.leaveChat(chat.id);
    } catch (error) {
      console.log(error.message || error);
    }
    return;
  }

  const saved = await api("chat", {
    method: "POST",
    body: {
      chat_id: chat.id,
      title: chat.title || "Группа",
      kind: "group",
      actor_id: from.id,
    },
  });
  if (!saved.ok) return;

  await bot.sendMessage(
    chat.id,
    "Чат подключён. Заявки с cursiva.ru будут приходить сюда.\n\nКоманды: /leads, /new, /task, /income, /expense, /help"
  );
}

module.exports = { handleMessage, handleMembership };
