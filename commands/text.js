const { api, maxUsers } = require("../functions/api");
const { inlineWebApp } = require("../components/inlineWebApp");
const { replyKeyboard } = require("../components/replyKeyboard");

const STATUS_WORDS = new Map([
  ["активный", "active"],
  ["активная", "active"],
  ["active", "active"],
  ["в", "progress"],
  ["работе", "progress"],
  ["progress", "progress"],
  ["закрыт", "closed"],
  ["закрыта", "closed"],
  ["closed", "closed"],
  ["отменен", "cancelled"],
  ["отменён", "cancelled"],
  ["отменена", "cancelled"],
  ["cancelled", "cancelled"],
]);

const STATUS_LABELS = {
  active: "активный",
  progress: "в работе",
  closed: "закрыт",
  cancelled: "отменен",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function statusFromWords(words) {
  const text = words.join(" ").trim().toLowerCase();
  if (text === "в работе" || text === "работе") return "progress";
  return STATUS_WORDS.get(text) || "";
}

function formatLead(lead) {
  const lines = [
    `<b>№ ${lead.id}</b> ${escapeHtml(lead.name)}`,
    escapeHtml(lead.phone),
    escapeHtml(STATUS_LABELS[lead.status] || lead.status),
  ];
  const meta = [lead.source, lead.service, lead.city].filter(Boolean).join(", ");
  if (meta) lines.push(escapeHtml(meta));
  if (lead.description) lines.push(escapeHtml(lead.description).slice(0, 400));
  if (lead.note) lines.push(`Заметка: ${escapeHtml(lead.note)}`);
  return lines.join("\n");
}

async function sendLeads(bot, msg) {
  const result = await api("leads_bot");
  if (!result.ok) {
    await bot.sendMessage(msg.chat.id, "Список заявок сейчас не открывается.");
    return;
  }

  const leads = (result.payload.leads || []).slice(0, 5);
  const text = leads.length
    ? `Последние заявки\n\n${leads.map(formatLead).join("\n\n")}`
    : "Заявок пока нет.";

  await bot.sendMessage(msg.chat.id, text, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: inlineWebApp(),
  });
}

async function setLeadStatus(bot, msg, args) {
  const id = Number(args[0]);
  const status = statusFromWords(args.slice(1));
  if (!id || !status) {
    await bot.sendMessage(msg.chat.id, "Напишите так: /status 12 в работе");
    return;
  }

  const result = await api("status_bot", {
    method: "POST",
    body: { id, status, actor_id: msg.from.id },
  });
  const message = result.payload.message || (result.ok ? `№ ${id}: ${STATUS_LABELS[status]}` : "Статус не изменился.");
  await bot.sendMessage(msg.chat.id, message);
}

async function setLeadNote(bot, msg, args) {
  const id = Number(args[0]);
  const note = args.slice(1).join(" ").trim();
  if (!id || !note) {
    await bot.sendMessage(msg.chat.id, "Напишите так: /note 12 перезвонить завтра");
    return;
  }

  const result = await api("note_bot", {
    method: "POST",
    body: { id, note, actor_id: msg.from.id },
  });
  await bot.sendMessage(msg.chat.id, result.ok ? `Заметка к № ${id} сохранена.` : (result.payload.message || "Заметку не удалось сохранить."));
}

async function listUsers(bot, msg) {
  const result = await api("users");
  const users = result.payload.users || [];
  const lines = users.map((user) => {
    const role = user.role === "owner" ? "владелец" : "команда";
    const name = user.name ? `${user.name} ` : "";
    return `${name}${user.telegram_id} — ${role}`;
  });
  const count = result.payload.count || users.length;
  await bot.sendMessage(
    msg.chat.id,
    `Доступ: ${count} из ${maxUsers()}\n\n${lines.join("\n") || "Пока никого нет."}\n\nДобавить: /allow и номер Telegram, или ответьте /allow на сообщение человека.`
  );
}

async function changeUser(bot, msg, args, allow) {
  let telegramId = Number(args[0]);
  let name = "";
  if ((!telegramId || telegramId < 1) && msg.reply_to_message && msg.reply_to_message.from) {
    telegramId = msg.reply_to_message.from.id;
    name = [msg.reply_to_message.from.first_name, msg.reply_to_message.from.last_name].filter(Boolean).join(" ");
  }
  if (!telegramId) {
    await bot.sendMessage(msg.chat.id, allow ? "Напишите /allow 123456789 или ответьте /allow на сообщение." : "Напишите /deny 123456789.");
    return;
  }

  const result = await api(allow ? "allow" : "deny", {
    method: "POST",
    body: {
      telegram_id: telegramId,
      name,
      actor_id: msg.from.id,
      max_users: maxUsers(),
    },
  });
  const fallback = allow ? `Пользователь ${telegramId} добавлен.` : `Пользователь ${telegramId} убран.`;
  await bot.sendMessage(msg.chat.id, result.payload.message || (result.ok ? fallback : "Не получилось изменить доступ."));
}

async function helpText(bot, msg) {
  const text = `Заявки Cursiva

Форма на cursiva.ru присылает сообщение в этот чат и в подключённые группы.

Кнопка «Заявки» слева от поля ввода открывает список.
Кнопка «Открыть заявки» под сообщением тоже открывает список.

Текстом:
/leads — последние заявки
/status 12 в работе
/note 12 перезвонить завтра
/users — кто имеет доступ
/allow 123456789 — добавить, это может владелец
/deny 123456789 — убрать

Статусы: активный, в работе, закрыт, отменен.
В боте может быть не больше ${maxUsers()} человек.
Бота можно добавить в группу: заявки будут приходить и туда, команды те же.`;

  await bot.sendMessage(msg.chat.id, text, {
    reply_markup: msg.chat.type === "private" ? replyKeyboard() : inlineWebApp(),
  });
}

module.exports = {
  sendLeads,
  setLeadStatus,
  setLeadNote,
  listUsers,
  changeUser,
  helpText,
};
