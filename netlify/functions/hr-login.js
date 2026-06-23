const { createSession, json, sessionCookie } = require("./hr-auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return json(400, { ok: false, error: "Invalid request" });
  }

  const configuredCode = process.env.HR_ACCESS_CODE;

  if (!configuredCode) {
    return json(503, {
      ok: false,
      error: "HR access is not configured. Set HR_ACCESS_CODE in Netlify environment variables."
    });
  }

  if (body.accessCode !== configuredCode) {
    return json(401, { ok: false, error: "Access denied" });
  }

  return json(200, { ok: true }, {
    "Set-Cookie": sessionCookie(createSession())
  });
};
