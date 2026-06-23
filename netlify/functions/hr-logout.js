const { clearSessionCookie, json } = require("./hr-auth");

exports.handler = async () => json(200, { ok: true }, {
  "Set-Cookie": clearSessionCookie()
});
