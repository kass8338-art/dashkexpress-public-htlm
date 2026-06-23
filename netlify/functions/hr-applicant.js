const { json, verifySession } = require("./hr-auth");

const MAX_FIELD_LENGTH = 1200;

function clean(value) {
  return String(value || "").trim().slice(0, MAX_FIELD_LENGTH);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  if (!verifySession(event.headers.cookie || "")) {
    return json(401, { ok: false, error: "HR session required" });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return json(400, { ok: false, error: "Invalid request" });
  }

  const applicant = {
    applicantName: clean(body.applicantName),
    applicantPhone: clean(body.applicantPhone),
    role: clean(body.role),
    market: clean(body.market),
    skills: Array.isArray(body.skills) ? body.skills.map(clean).filter(Boolean).slice(0, 12) : [],
    screeningNotes: clean(body.screeningNotes),
    receivedAt: new Date().toISOString()
  };

  if (!applicant.applicantName || !applicant.applicantPhone) {
    return json(422, {
      ok: false,
      error: "Applicant name and phone are required."
    });
  }

  return json(200, {
    ok: true,
    applicant,
    message: "Applicant summary received. Configure an email or database provider before storing real documents or payment data."
  });
};
