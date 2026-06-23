const HR_UNLOCK_KEY = "dashKExpressHrUnlocked";
const loginSection = document.querySelector("#hr-login");
const loginForm = document.querySelector("#hr-login-form");
const loginMessage = document.querySelector("#hr-login-message");
const recruitingSection = document.querySelector("#recruiting");
const hrForm = document.querySelector("#crew-application-form");
const hrRunButton = document.querySelector("[data-hr-run]");
const hrResetButton = document.querySelector("[data-hr-reset]");
const hrEmailButton = document.querySelector("[data-hr-email]");
const hrSubmitButton = document.querySelector("[data-hr-submit]");
const hrLogoutButton = document.querySelector("[data-hr-logout]");
const hrSubmitMessage = document.querySelector("#hr-submit-message");
const hrStatus = document.querySelector("#hr-status");
const hrSteps = Array.from(document.querySelectorAll("#hr-steps li"));
const hrNextTask = document.querySelector("#hr-next-task");
const hrDetail = document.querySelector("#hr-detail");
const hrApplicant = document.querySelector("#hr-applicant");
const hrRole = document.querySelector("#hr-role");
const hrMarket = document.querySelector("#hr-market");

let hrRunId = 0;

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function updateHrSummary() {
  hrApplicant.textContent = hrForm.elements.applicantName.value || "New applicant";
  hrRole.textContent = hrForm.elements.role.value;
  hrMarket.textContent = hrForm.elements.market.value;
}

function setHrUnlocked(unlocked) {
  loginSection.hidden = unlocked;
  recruitingSection.hidden = !unlocked;
  hrLogoutButton.hidden = !unlocked;
  recruitingSection.classList.toggle("is-locked", !unlocked);

  if (unlocked) {
    sessionStorage.setItem(HR_UNLOCK_KEY, "true");
    requestAnimationFrame(() => {
      hrForm.elements.applicantName.focus();
    });
  }
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

function getCheckedSkills() {
  return Array.from(hrForm.querySelectorAll("input[type='checkbox']:checked"))
    .map((item) => item.closest("label").textContent.trim());
}

function buildApplicantEmail() {
  const applicant = hrForm.elements.applicantName.value || "New applicant";
  const subject = `Dash K Express crew application - ${applicant}`;
  const body = [
    "Dash K Express crew application",
    "",
    `Applicant: ${applicant}`,
    `Phone: ${hrForm.elements.applicantPhone.value || "Not provided"}`,
    `Role: ${hrForm.elements.role.value}`,
    `Market: ${hrForm.elements.market.value}`,
    "",
    "Qualifications:",
    ...getCheckedSkills().map((skill) => `- ${skill}`),
    "",
    "Screening notes:",
    hrForm.elements.screeningNotes.value || "No notes entered.",
    "",
    "Next steps:",
    "- Confirm applicant consent before background checks.",
    "- Collect documents through a secure upload process.",
    "- Set up payouts through a secure provider before dispatch activation."
  ].join("\n");

  return `mailto:kass@dashkexpress.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function applicantPayload() {
  return {
    applicantName: hrForm.elements.applicantName.value,
    applicantPhone: hrForm.elements.applicantPhone.value,
    role: hrForm.elements.role.value,
    market: hrForm.elements.market.value,
    skills: getCheckedSkills(),
    screeningNotes: hrForm.elements.screeningNotes.value
  };
}

function setHrStep(stepName, state) {
  const step = hrSteps.find((item) => item.dataset.hrStep === stepName);

  if (!step) {
    return;
  }

  step.classList.remove("active", "done");

  if (state) {
    step.classList.add(state);
  }
}

function resetHrAgent() {
  hrRunId += 1;
  hrSteps.forEach((step) => step.classList.remove("active", "done"));
  hrRunButton.disabled = false;
  hrRunButton.textContent = "Run HR agent";
  hrStatus.textContent = "Ready to screen";
  hrNextTask.textContent = "Review application";
  hrDetail.textContent = "The HR agent is ready to qualify a driver or crew applicant.";
  updateHrSummary();
}

async function runHrAgent() {
  const runId = hrRunId + 1;
  const pipeline = [
    ["application", "Application received", "Collected applicant role, location, phone, equipment, and availability."],
    ["screen", "Screening applicant", "Checking service fit, communication quality, moving experience, and market coverage."],
    ["background", "Background check ready", "Prepare consent-based background check invitation before any real screening is ordered."],
    ["documents", "Documents requested", "Request driver license, insurance, tax details, and work authorization documents."],
    ["payment", "Payment setup", "Start secure payout onboarding for ACH, debit card, or contractor payment profile."],
    ["active", "Ready for dispatch", "Applicant can be activated after documents, background check, and payout setup are approved."]
  ];

  hrRunId = runId;
  hrRunButton.disabled = true;
  hrRunButton.textContent = "Running";
  hrSteps.forEach((step) => step.classList.remove("active", "done"));
  updateHrSummary();

  for (const [stepName, title, detail] of pipeline) {
    if (runId !== hrRunId) {
      return;
    }

    hrSteps.forEach((step) => step.classList.remove("active"));
    setHrStep(stepName, "active");
    hrStatus.textContent = title;
    hrNextTask.textContent = title;
    hrDetail.textContent = detail;
    await wait(620);
    setHrStep(stepName, "done");
  }

  if (runId === hrRunId) {
    hrSteps.forEach((step) => step.classList.remove("active"));
    hrRunButton.disabled = false;
    hrRunButton.textContent = "Run HR agent";
    hrStatus.textContent = "Onboarding complete";
  }
}

hrForm.addEventListener("input", updateHrSummary);
hrForm.addEventListener("change", updateHrSummary);
hrRunButton.addEventListener("click", runHrAgent);
hrResetButton.addEventListener("click", resetHrAgent);
hrEmailButton.addEventListener("click", () => {
  window.location.href = buildApplicantEmail();
});
hrSubmitButton.addEventListener("click", async () => {
  hrSubmitButton.disabled = true;
  hrSubmitButton.textContent = "Submitting";
  hrSubmitMessage.textContent = "Sending applicant summary to the protected HR endpoint.";

  try {
    const result = await apiRequest("/api/hr-applicant", {
      method: "POST",
      body: JSON.stringify(applicantPayload())
    });
    hrSubmitMessage.textContent = result.message || "Applicant summary submitted.";
  } catch (error) {
    hrSubmitMessage.textContent = `${error.message} Use email backup if needed.`;
  } finally {
    hrSubmitButton.disabled = false;
    hrSubmitButton.textContent = "Submit applicant summary";
  }
});

async function unlockHrConsole(event) {
  event.preventDefault();
  loginForm.querySelector("button[type='submit']").disabled = true;
  loginMessage.textContent = "Checking HR access.";

  try {
    await apiRequest("/api/hr-login", {
      method: "POST",
      body: JSON.stringify({ accessCode: loginForm.elements.accessCode.value.trim() })
    });
    loginForm.classList.remove("denied");
    loginMessage.textContent = "Access granted.";
    setHrUnlocked(true);
    return;
  } catch (error) {
    loginForm.classList.add("denied");
    loginMessage.textContent = error.message;
    loginForm.elements.accessCode.select();
  } finally {
    loginForm.querySelector("button[type='submit']").disabled = false;
  }
}

loginForm.addEventListener("submit", unlockHrConsole);
loginForm.querySelector("button[type='submit']").addEventListener("click", unlockHrConsole);
hrLogoutButton.addEventListener("click", async () => {
  await apiRequest("/api/hr-logout", { method: "POST" }).catch(() => null);
  sessionStorage.removeItem(HR_UNLOCK_KEY);
  setHrUnlocked(false);
  loginMessage.textContent = "Logged out.";
  loginForm.elements.accessCode.value = "";
  loginForm.elements.accessCode.focus();
});

apiRequest("/api/hr-session")
  .then((session) => {
    setHrUnlocked(!!session.authenticated);
  })
  .catch(() => {
    if (sessionStorage.getItem(HR_UNLOCK_KEY) === "true") {
      loginMessage.textContent = "Server session check unavailable. Use the HR code when deployed.";
    }
  });

updateHrSummary();

window.DashKHR = {
  run: runHrAgent,
  reset: resetHrAgent
};
