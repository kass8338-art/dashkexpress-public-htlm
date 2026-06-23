const form = document.querySelector("#quote-form");
const distanceInput = form.elements.distance;
const distanceOutput = document.querySelector("#distance-output");
const estimateTotal = document.querySelector("#estimate-total");
const estimateDetail = document.querySelector("#estimate-detail");
const basePrice = document.querySelector("#base-price");
const laborPrice = document.querySelector("#labor-price");
const distancePrice = document.querySelector("#distance-price");
const addonPrice = document.querySelector("#addon-price");
const bookButton = document.querySelector("#book-button");
const saveDraftButton = document.querySelector("#save-draft-button");
const statusButton = document.querySelector("[data-advance-status]");
const mobileStatus = document.querySelector("#mobile-status");
const mobileDetail = document.querySelector("#mobile-detail");
const timelineItems = Array.from(document.querySelectorAll("#timeline li"));
const agentPanel = document.querySelector(".agent-panel");
const agentStatus = document.querySelector("#agent-status");
const agentDetail = document.querySelector("#agent-detail");
const agentLog = document.querySelector("#agent-log");
const agentSteps = Array.from(document.querySelectorAll("#agent-steps li"));
const agentRunButton = document.querySelector("[data-agent-run]");
const agentPauseButton = document.querySelector("[data-agent-pause]");
const agentResetButton = document.querySelector("[data-agent-reset]");
const crewCards = Array.from(document.querySelectorAll(".crew-card"));
const activeJobCard = document.querySelector("[data-job-card='active']");
const installButton = document.querySelector("#install-app-button");
const installStatus = document.querySelector("#app-install-status");
const DRAFT_KEY = "dashKExpressBookingDraft";

const sizeRates = {
  single: { minutes: 35 },
  room: { minutes: 70 },
  apartment: { minutes: 120 },
  home: { minutes: 185 }
};

const vehicleRates = {
  lite: { label: "Lite", minimum: 49, movers: 1, perMile: 2.15, perMinute: 0.72 },
  pickup: { label: "Pickup", minimum: 79, movers: 1, perMile: 2.75, perMinute: 0.88 },
  van: { label: "Van", minimum: 99, movers: 2, perMile: 3.25, perMinute: 1.08 },
  xl: { label: "XL", minimum: 129, movers: 2, perMile: 3.75, perMinute: 1.24 },
  box: { label: "Box truck", minimum: 169, movers: 2, perMile: 4.35, perMinute: 1.48 },
  boxPlus: { label: "Box+", minimum: 219, movers: 3, perMile: 4.95, perMinute: 1.82 }
};

const serviceMultipliers = {
  delivery: 1,
  "small-move": 1.18,
  "full-move": 1.42
};

const statusCopy = [
  ["Booked", "Your move is reserved and dispatch is reviewing crew options."],
  ["Crew assigned", "Marco and Jalen arrive in 28 minutes."],
  ["En route", "Your crew is on the way with live ETA enabled."],
  ["Loading", "The crew is wrapping furniture and loading the truck."],
  ["Complete", "Receipt, photos, rating, and tip are ready."]
];

let statusIndex = 1;
let agentRunId = 0;
let agentPaused = false;
let deferredInstallPrompt = null;

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function estimate() {
  const formData = new FormData(form);
  const size = formData.get("size");
  const service = formData.get("service");
  const vehicle = formData.get("vehicle");
  const stairs = Number(formData.get("stairs") || 0);
  const distance = Number(formData.get("distance") || 1);
  const rate = sizeRates[size];
  const vehicleRate = vehicleRates[vehicle];

  const laborMinutes = Math.round((rate.minutes + stairs * 6) * serviceMultipliers[service]);
  const base = vehicleRate.minimum;
  const labor = Math.round(laborMinutes * vehicleRate.perMinute);
  const travel = Math.round(Math.max(10, distance * vehicleRate.perMile));
  let addons = stairs * 9;

  ["assembly", "packing", "priority", "protection", "labor", "removal"].forEach((name) => {
    if (formData.get(name)) {
      addons += name === "priority" ? 24 : name === "protection" ? 5 : name === "removal" ? 35 : 18;
    }
  });

  const total = base + labor + travel + addons;
  const minutes = laborMinutes + Math.round(distance * 3);

  distanceOutput.value = distance;
  estimateTotal.textContent = money(total);
  basePrice.textContent = money(base);
  laborPrice.textContent = money(labor);
  distancePrice.textContent = money(travel);
  addonPrice.textContent = money(addons);
  estimateDetail.textContent = `${vehicleRate.label}, ${vehicleRate.movers} mover${vehicleRate.movers > 1 ? "s" : ""}, about ${minutes} minutes`;
}

function updateStatus() {
  timelineItems.forEach((item, index) => {
    item.classList.toggle("done", index <= statusIndex);
  });

  mobileStatus.textContent = statusCopy[statusIndex][0];
  mobileDetail.textContent = statusCopy[statusIndex][1];
}

function setStatus(index) {
  statusIndex = Math.max(0, Math.min(index, statusCopy.length - 1));
  updateStatus();
}

function fillDemo() {
  form.elements.pickup.value = "850 W Madison St";
  form.elements.dropoff.value = "2211 N Milwaukee Ave";
  form.elements.window.value = "10:00 AM - 12:00 PM";
  form.elements.size.value = "room";
  form.elements.vehicle.value = "van";
  form.elements.stairs.value = "2";
  form.elements.distance.value = "11";
  form.elements.assembly.checked = true;
  form.elements.priority.checked = true;
  form.elements.labor.checked = false;
  form.elements.removal.checked = false;
  form.elements.notes.value = "Sofa, media console, four boxes. Freight elevator reserved.";
  form.querySelector("[value='small-move']").checked = true;
  estimate();
}

function bookingSnapshot() {
  const formData = new FormData(form);
  return {
    pickup: formData.get("pickup"),
    dropoff: formData.get("dropoff"),
    date: formData.get("date"),
    window: formData.get("window"),
    service: formData.get("service"),
    size: formData.get("size"),
    stairs: formData.get("stairs"),
    vehicle: formData.get("vehicle"),
    distance: formData.get("distance"),
    notes: formData.get("notes"),
    assembly: !!formData.get("assembly"),
    packing: !!formData.get("packing"),
    priority: !!formData.get("priority"),
    protection: !!formData.get("protection"),
    labor: !!formData.get("labor"),
    removal: !!formData.get("removal"),
    estimate: estimateTotal.textContent,
    savedAt: new Date().toISOString()
  };
}

function restoreBookingDraft() {
  const rawDraft = localStorage.getItem(DRAFT_KEY);
  if (!rawDraft) {
    return;
  }

  try {
    const draft = JSON.parse(rawDraft);
    form.elements.pickup.value = draft.pickup || "";
    form.elements.dropoff.value = draft.dropoff || "";
    form.elements.date.value = draft.date || form.elements.date.value;
    form.elements.window.value = draft.window || form.elements.window.value;
    form.elements.size.value = draft.size || form.elements.size.value;
    form.elements.stairs.value = draft.stairs || "0";
    form.elements.vehicle.value = draft.vehicle || form.elements.vehicle.value;
    form.elements.distance.value = draft.distance || form.elements.distance.value;
    form.elements.notes.value = draft.notes || "";
    form.elements.assembly.checked = !!draft.assembly;
    form.elements.packing.checked = !!draft.packing;
    form.elements.priority.checked = !!draft.priority;
    form.elements.protection.checked = draft.protection !== false;
    form.elements.labor.checked = !!draft.labor;
    form.elements.removal.checked = !!draft.removal;

    const serviceInput = form.querySelector(`[name="service"][value="${draft.service || "delivery"}"]`);
    if (serviceInput) {
      serviceInput.checked = true;
    }

    estimate();
    saveDraftButton.textContent = "Draft restored";
    window.setTimeout(() => {
      saveDraftButton.textContent = "Save booking draft";
    }, 1800);
  } catch (error) {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function saveBookingDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(bookingSnapshot()));
  saveDraftButton.textContent = "Draft saved";
  window.setTimeout(() => {
    saveDraftButton.textContent = "Save booking draft";
  }, 1800);
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function logAgent(message) {
  const entry = document.createElement("p");
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  entry.textContent = `[${time}] ${message}`;

  if (agentLog.textContent.includes("Agent log will appear here.")) {
    agentLog.textContent = "";
  }

  agentLog.append(entry);
  agentLog.scrollTop = agentLog.scrollHeight;
}

function setAgentState(title, detail) {
  agentStatus.textContent = title;
  agentDetail.textContent = detail;
}

function setAgentStep(stepName, state) {
  const step = agentSteps.find((item) => item.dataset.step === stepName);
  if (!step) {
    return;
  }

  step.classList.remove("active", "done");
  if (state) {
    step.classList.add(state);
  }
}

function activateAgentStep(stepName, title, detail) {
  agentSteps.forEach((step) => step.classList.remove("active"));
  setAgentStep(stepName, "active");
  setAgentState(title, detail);
  logAgent(detail);
}

function completeAgentStep(stepName) {
  setAgentStep(stepName, "done");
}

function assertAgentCanContinue(runId) {
  if (runId !== agentRunId || agentPaused) {
    throw new Error("Agent paused");
  }
}

async function agentDelay(runId, milliseconds = 700) {
  await wait(milliseconds);
  assertAgentCanContinue(runId);
}

function reserveCrew() {
  bookButton.textContent = "Crew reserved";
  bookButton.disabled = true;
  bookButton.style.opacity = "0.82";
}

function assignNearestCrew() {
  crewCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.crew === "marco");
  });

  activeJobCard?.classList.add("agent-updated");
  const meter = activeJobCard?.querySelector("meter");
  const description = activeJobCard?.querySelector("p");

  if (meter) {
    meter.value = 88;
    meter.setAttribute("value", "88");
  }

  if (description) {
    description.textContent = "2 movers assigned, box truck confirmed, customer notified";
  }
}

function resetAgent() {
  agentRunId += 1;
  agentPaused = false;
  agentPanel.classList.remove("running");
  agentRunButton.disabled = false;
  agentRunButton.textContent = "Run agent";
  agentSteps.forEach((step) => step.classList.remove("active", "done"));
  agentLog.innerHTML = "<p>Agent log will appear here.</p>";
  setAgentState("Standing by", "Ready to automate a Dash K Express booking.");
  bookButton.textContent = "Reserve crew";
  bookButton.disabled = false;
  bookButton.style.opacity = "1";
  setStatus(1);
  crewCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.crew === "marco");
  });
  activeJobCard?.classList.remove("agent-updated");
  const meter = activeJobCard?.querySelector("meter");
  const description = activeJobCard?.querySelector("p");
  if (meter) {
    meter.value = 62;
    meter.setAttribute("value", "62");
  }
  if (description) {
    description.textContent = "2 movers, box truck, elevator reserved";
  }
}

async function runAgent() {
  const runId = agentRunId + 1;
  agentRunId = runId;
  agentPaused = false;
  agentPanel.classList.add("running");
  agentRunButton.disabled = true;
  agentRunButton.textContent = "Running";
  agentLog.innerHTML = "";
  agentSteps.forEach((step) => step.classList.remove("active", "done"));

  try {
    activateAgentStep("quote", "Collecting job details", "Filling pickup, dropoff, service, distance, and customer notes.");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    fillDemo();
    await agentDelay(runId);
    completeAgentStep("quote");

    activateAgentStep("estimate", "Building quote", "Recalculating price with labor, distance, stairs, protection, and priority dispatch.");
    estimate();
    await agentDelay(runId);
    completeAgentStep("estimate");

    activateAgentStep("reserve", "Reserving crew", "Locking the customer quote and confirming the crew reservation.");
    reserveCrew();
    await agentDelay(runId);
    completeAgentStep("reserve");

    activateAgentStep("dispatch", "Assigning truck", "Matching Marco Rivera's box truck because it is the closest properly equipped crew.");
    document.querySelector("#teams").scrollIntoView({ behavior: "smooth", block: "start" });
    assignNearestCrew();
    await agentDelay(runId);
    completeAgentStep("dispatch");

    activateAgentStep("track", "Advancing tracking", "Moving the customer timeline from crew assigned to en route, loading, and complete.");
    document.querySelector("#tracking").scrollIntoView({ behavior: "smooth", block: "start" });
    for (let index = 2; index < statusCopy.length; index += 1) {
      setStatus(index);
      logAgent(`Customer status updated to ${statusCopy[index][0]}.`);
      await agentDelay(runId, 520);
    }
    completeAgentStep("track");

    activateAgentStep("ops", "Updating dispatch board", "Marking the active move as crew confirmed and nearly ready for completion.");
    document.querySelector("#ops").scrollIntoView({ behavior: "smooth", block: "start" });
    activeJobCard?.classList.add("agent-updated");
    await agentDelay(runId);
    completeAgentStep("ops");

    agentSteps.forEach((step) => step.classList.remove("active"));
    agentPanel.classList.remove("running");
    setAgentState("Automation complete", "The demo booking, tracking, crew assignment, and dispatch board are updated.");
    logAgent("Agent run complete.");
  } catch (error) {
    agentPanel.classList.remove("running");
    setAgentState("Paused", "Agent run paused. Press Run agent to start a fresh automation.");
    logAgent("Agent paused before finishing.");
  } finally {
    if (runId === agentRunId) {
      agentRunButton.disabled = false;
      agentRunButton.textContent = "Run agent";
    }
  }
}

form.addEventListener("input", estimate);
form.addEventListener("change", estimate);

document.querySelector("[data-fill-demo]").addEventListener("click", fillDemo);
document.querySelector("[data-scroll-target]").addEventListener("click", () => {
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});

statusButton.addEventListener("click", () => {
  statusIndex = (statusIndex + 1) % statusCopy.length;
  updateStatus();
});

bookButton.addEventListener("click", () => {
  reserveCrew();
});

saveDraftButton.addEventListener("click", saveBookingDraft);

agentRunButton.addEventListener("click", runAgent);

agentPauseButton.addEventListener("click", () => {
  agentPaused = true;
  agentRunId += 1;
  agentPanel.classList.remove("running");
  agentRunButton.disabled = false;
  agentRunButton.textContent = "Run agent";
  setAgentState("Paused", "Agent run paused by dispatcher.");
  logAgent("Pause requested.");
});

agentResetButton.addEventListener("click", resetAgent);

window.DashKAgent = {
  run: runAgent,
  pause() {
    agentPauseButton.click();
  },
  reset: resetAgent,
  fillDemo,
  setStatus
};

document.body.dataset.agentApi = "ready";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(() => {
        document.body.dataset.pwa = "ready";
        installStatus.textContent = "Mobile app ready";
      })
      .catch(() => {
        document.body.dataset.pwa = "offline-unavailable";
        installStatus.textContent = "Mobile app shell unavailable";
      });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
  installStatus.textContent = "Install available";
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
  installStatus.textContent = choice.outcome === "accepted" ? "Installed" : "Mobile app ready";
});

const today = new Date();
today.setDate(today.getDate() + 1);
form.elements.date.valueAsDate = today;
restoreBookingDraft();
estimate();
updateStatus();
