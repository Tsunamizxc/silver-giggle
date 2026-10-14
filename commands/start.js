const { handleWebApp } = require("../functions/handleWebApp");
const { registerNow } = require("../functions/registerManager");

async function startCommand(bot, msg) {
  const ready = await registerNow(msg);
  await handleWebApp(bot, msg, ready);
}

module.exports = { startCommand };
