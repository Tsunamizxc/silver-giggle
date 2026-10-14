const { api } = require("../functions/api");
const { inlineWebApp } = require("../components/inlineWebApp");

function actorBody(msg, extra) {
  return Object.assign({ actor_id: msg.from.id }, extra || {});
}

async function fail(bot, msg, result, fallback) {
  const message = (result.payload && (result.payload.message || result.payload.error)) || fallback;
  await bot.sendMessage(msg.chat.id, message);
}

async function openOffice(bot, msg) {
  await bot.sendMessage(msg.chat.id, "Офис Cursiva: заявки, задачи и деньги. Внизу экрана три раздела.", {
    reply_markup: inlineWebApp(),
  });
}

async function createLead(bot, msg, args) {
  const phoneIndex = args.findIndex((part) => (part.match(/\d/g) || []).length >= 6);
  if (args.length < 2 || phoneIndex < 1) {
    await bot.sendMessage(msg.chat.id, "Напишите так: /new Иван 79991234567 нужен сайт");
    return;
  }

  const result = await api("lead_manual_bot", {
    method: "POST",
    body: actorBody(msg, {
      name: args.slice(0, phoneIndex).join(" "),
      phone: args[phoneIndex],
      description: args.slice(phoneIndex + 1).join(" "),
      source: "вручную",
    }),
  });
  if (!result.ok) {
    await fail(bot, msg, result, "Заявку не удалось сохранить.");
    return;
  }
  await bot.sendMessage(msg.chat.id, `Заявка № ${result.payload.id} сохранена.`, {
    reply_markup: inlineWebApp(),
  });
}

async function createTask(bot, msg, args) {
  const title = args.join(" ").trim();
  if (!title) {
    await bot.sendMessage(msg.chat.id, "Напишите так: /task купить домен");
    return;
  }
  const result = await api("task_bot", {
    method: "POST",
    body: actorBody(msg, { title }),
  });
  if (!result.ok) {
    await fail(bot, msg, result, "Задачу не удалось сохранить.");
    return;
  }
  await bot.sendMessage(msg.chat.id, `Задача № ${result.payload.task.id} сохранена. Открытых: ${result.payload.open}.`);
}

async function listTasks(bot, msg) {
  const result = await api(`tasks_bot&actor_id=${msg.from.id}`);
  if (!result.ok) {
    await fail(bot, msg, result, "Задачи сейчас не открываются.");
    return;
  }
  const open = (result.payload.tasks || []).filter((task) => !task.done).slice(0, 15);
  const text = open.length
    ? `Открытые задачи\n\n${open.map((task) => `№ ${task.id} ${task.title}`).join("\n")}`
    : "Открытых задач нет.";
  await bot.sendMessage(msg.chat.id, `${text}\n\nЗакрыть: /done 12`);
}

async function completeTask(bot, msg, args) {
  const id = Number(args[0]);
  if (!id) {
    await bot.sendMessage(msg.chat.id, "Напишите так: /done 12");
    return;
  }
  const result = await api("task_update_bot", {
    method: "POST",
    body: actorBody(msg, { id, done: 1 }),
  });
  if (!result.ok) {
    await fail(bot, msg, result, "Задачу не удалось закрыть.");
    return;
  }
  await bot.sendMessage(msg.chat.id, `Задача № ${id} сделана. Открытых: ${result.payload.open}.`);
}

async function addMoney(bot, msg, args, kind) {
  const amount = args[0];
  const title = args.slice(1).join(" ").trim();
  if (!amount || !title) {
    await bot.sendMessage(msg.chat.id, kind === "income" ? "Напишите так: /income 15000 оплата сайта" : "Напишите так: /expense 3000 реклама");
    return;
  }
  const result = await api("money_bot", {
    method: "POST",
    body: actorBody(msg, { kind, amount, title }),
  });
  if (!result.ok) {
    await fail(bot, msg, result, "Сумму не удалось записать.");
    return;
  }
  const month = result.payload.month || {};
  await bot.sendMessage(
    msg.chat.id,
    `${result.payload.message || "Записано."}\n\n${result.payload.month_label}: доход ${month.income_label}, расход ${month.expense_label}, прибыль ${month.profit_label}`
  );
}

module.exports = {
  openOffice,
  createLead,
  createTask,
  listTasks,
  completeTask,
  addMoney,
};
