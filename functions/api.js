require("dotenv").config();

function apiUrl(action) {
  const base = process.env.LEAD_API_URL || "https://cursivalead.cursiva-dev.ru/api.php";
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}action=${action}`;
}

function maxUsers() {
  const value = Number(process.env.MAX_USERS || 5);
  return value > 0 ? value : 5;
}

async function api(action, options = {}) {
  const headers = {
    "X-Bot-Secret": process.env.BOT_SECRET || "",
  };
  if (options.body) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(apiUrl(action), {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.log(`${action}: ${error.message || error}`);
    return {
      ok: false,
      status: 0,
      payload: { message: "Сайт офиса не ответил, попробуйте ещё раз через минуту." },
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    payload: payload || {},
  };
}

module.exports = { api, maxUsers };
