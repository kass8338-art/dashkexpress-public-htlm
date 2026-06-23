const crypto = require("crypto");

const COOKIE_NAME = "dashk_hr_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  const secret = process.env.HR_SESSION_SECRET || process.env.HR_ACCESS_CODE || "local-dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSession() {
  const payload = JSON.stringify({
    aud: "dashk-hr",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  });
  const encoded = base64url(payload);
  return `${encoded}.${sign(encoded)}`;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, item) => {
    const [name, ...rest] = item.trim().split("=");

    if (name) {
      cookies[name] = decodeURIComponent(rest.join("="));
    }

    return cookies;
  }, {});
}

function verifySession(cookieHeader) {
  const token = parseCookies(cookieHeader)[COOKIE_NAME];

  if (!token || !token.includes(".")) {
    return false;
  }

  const [encoded, signature] = token.split(".");
  const expected = sign(encoded);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.aud === "dashk-hr" && payload.exp > Math.floor(Date.now() / 1000);
  } catch (error) {
    return false;
  }
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

function sessionCookie(value) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

module.exports = {
  clearSessionCookie,
  createSession,
  json,
  sessionCookie,
  verifySession
};
