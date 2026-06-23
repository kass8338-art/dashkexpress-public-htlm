const { json, verifySession } = require("./hr-auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { authenticated: false, error: "Method not allowed" });
  }

  return json(200, {
    authenticated: verifySession(event.headers.cookie || "")
  });
};
