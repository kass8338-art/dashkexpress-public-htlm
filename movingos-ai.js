const form = document.querySelector("#quote-form");
const distanceOutput = document.querySelector("#distance-output");
const estimateTotal = document.querySelector("#estimate-total");
const estimateDetail = document.querySelector("#estimate-detail");
const laborPrice = document.querySelector("#labor-price");
const distancePrice = document.querySelector("#distance-price");
const opsPrice = document.querySelector("#ops-price");
const automationPrice = document.querySelector("#automation-price");
const generatedList = document.querySelector("#generated-list");
const generateButton = document.querySelector("#generate-button");
const saveButton = document.querySelector("#save-button");
const demoButton = document.querySelector("[data-fill-demo]");
const revenuePrice = document.querySelector("#revenue-price");
const setupFee = document.querySelector("#setup-fee");
const customersNeeded = document.querySelector("#customers-needed");
const revenueDetail = document.querySelector("#revenue-detail");
const capitalJobs = document.querySelector("#capital-jobs");
const capitalPayment = document.querySelector("#capital-payment");
const capitalRepeat = document.querySelector("#capital-repeat");
const capitalDispute = document.querySelector("#capital-dispute");
const capitalPaymentOutput = document.querySelector("#capital-payment-output");
const capitalRepeatOutput = document.querySelector("#capital-repeat-output");
const capitalDisputeOutput = document.querySelector("#capital-dispute-output");
const capitalScore = document.querySelector("#capital-score");
const capitalBand = document.querySelector("#capital-band");
const capitalDetail = document.querySelector("#capital-detail");
const OP_PACKAGE_KEY = "movingOSScenario";

const serviceRates = {
  local: { label: "Local move", baseHours: 2.6, hourly: 62, travel: 6 },
  delivery: { label: "Furniture delivery", baseHours: 1.3, hourly: 58, travel: 5 },
  labor: { label: "Labor only", baseHours: 1.8, hourly: 52, travel: 2 },
  junk: { label: "Junk removal", baseHours: 1.6, hourly: 56, travel: 5 }
};

const automationLabels = {
  contract: "Move contract drafted with scope, limits, payment terms, and damage policy.",
  invoice: "Invoice generated with deposit, balance due, and line-item job summary.",
  scheduling: "Appointment booked with reminder and reschedule logic ready.",
  receptionist: "24/7 receptionist answers pricing, service-area, and availability questions.",
  crm: "Lead, customer, job, payment, and follow-up records updated in the CRM.",
  reputation: "Google and Facebook review requests queued for post-job completion."
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function selectedAutomations() {
  return Object.keys(automationLabels).filter((key) => form.elements[key]?.checked);
}

function estimate() {
  const formData = new FormData(form);
  const service = formData.get("service");
  const crew = Number(formData.get("crew") || 2);
  const stairs = Number(formData.get("stairs") || 0);
  const distance = Number(formData.get("distance") || 1);
  const inventory = String(formData.get("inventory") || "");
  const inventoryComplexity = Math.min(1.8, Math.max(0, inventory.length / 180));
  const rate = serviceRates[service];
  const automations = selectedAutomations();

  const hours = rate.baseHours + inventoryComplexity + stairs * 0.18;
  const labor = Math.round(hours * crew * rate.hourly);
  const travel = Math.round(distance * rate.travel);
  const ops = Math.round(39 + automations.length * 8);
  const automationValue = Math.round(automations.length * 31 + (automations.includes("receptionist") ? 35 : 0));
  const total = labor + travel + ops + automationValue;

  distanceOutput.value = distance;
  estimateTotal.textContent = money(total);
  laborPrice.textContent = money(labor);
  distancePrice.textContent = money(travel);
  opsPrice.textContent = money(ops);
  automationPrice.textContent = money(automationValue);
  estimateDetail.textContent = `${crew} movers, ${hours.toFixed(1)} hours, ${automations.length} AI modules ready`;

  renderGeneratedPackage(rate.label, automations);
}

function renderGeneratedPackage(serviceLabel, automations) {
  const pickup = form.elements.pickup.value.trim() || "Pickup address pending";
  const dropoff = form.elements.dropoff.value.trim() || "Dropoff address pending";
  const baseItems = [
    `${serviceLabel} estimate from ${pickup} to ${dropoff}.`,
    `Pricing intelligence captured from job details: ${form.elements.inventory.value.trim() || "job description pending"}.`
  ];
  const items = baseItems.concat(automations.map((key) => automationLabels[key]));

  generatedList.replaceChildren(...items.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
}

function fillDemo() {
  form.elements.pickup.value = "850 W Madison St, Chicago";
  form.elements.dropoff.value = "2211 N Milwaukee Ave, Chicago";
  form.elements.inventory.value = "2 bed apartment: sofa, queen bed, dresser, dining table, TV stand, 18 boxes. Elevator at pickup, second-floor walk-up at dropoff.";
  form.elements.service.value = "local";
  form.elements.crew.value = "3";
  form.elements.stairs.value = "2";
  form.elements.distance.value = "11";
  form.elements.contract.checked = true;
  form.elements.invoice.checked = true;
  form.elements.scheduling.checked = true;
  form.elements.receptionist.checked = true;
  form.elements.crm.checked = true;
  form.elements.reputation.checked = true;
  estimate();
}

function scenarioSnapshot() {
  const formData = new FormData(form);
  return {
    pickup: formData.get("pickup"),
    dropoff: formData.get("dropoff"),
    inventory: formData.get("inventory"),
    service: formData.get("service"),
    crew: formData.get("crew"),
    stairs: formData.get("stairs"),
    distance: formData.get("distance"),
    automations: selectedAutomations(),
    estimate: estimateTotal.textContent,
    savedAt: new Date().toISOString()
  };
}

function saveScenario() {
  localStorage.setItem(OP_PACKAGE_KEY, JSON.stringify(scenarioSnapshot()));
  saveButton.textContent = "Scenario saved";
  window.setTimeout(() => {
    saveButton.textContent = "Save pilot scenario";
  }, 1600);
}

function restoreScenario() {
  const raw = localStorage.getItem(OP_PACKAGE_KEY);
  if (!raw) {
    estimate();
    return;
  }

  try {
    const scenario = JSON.parse(raw);
    form.elements.pickup.value = scenario.pickup || "";
    form.elements.dropoff.value = scenario.dropoff || "";
    form.elements.inventory.value = scenario.inventory || "";
    form.elements.service.value = scenario.service || "local";
    form.elements.crew.value = scenario.crew || "2";
    form.elements.stairs.value = scenario.stairs || "1";
    form.elements.distance.value = scenario.distance || "12";
    Object.keys(automationLabels).forEach((key) => {
      form.elements[key].checked = scenario.automations?.includes(key) || false;
    });
    estimate();
  } catch (error) {
    localStorage.removeItem(OP_PACKAGE_KEY);
    estimate();
  }
}

function updateRevenueCalculator() {
  if (!revenuePrice || !setupFee || !customersNeeded || !revenueDetail) {
    return;
  }

  const monthlyPrice = Number(revenuePrice.value || 149);
  const oneTimeRevenue = Number(setupFee.value || 0);
  const yearOnePerCustomer = monthlyPrice * 12 + oneTimeRevenue;
  const needed = Math.ceil(1000000 / yearOnePerCustomer);
  const annualRevenue = needed * yearOnePerCustomer;

  customersNeeded.textContent = new Intl.NumberFormat("en-US").format(needed);
  revenueDetail.textContent = `At ${money(monthlyPrice)}/month plus ${money(oneTimeRevenue)} setup/template revenue, ${needed.toLocaleString()} customers reaches about ${money(annualRevenue)} in year-one revenue.`;
}

function updateCapitalReadiness() {
  if (!capitalJobs || !capitalPayment || !capitalRepeat || !capitalDispute || !capitalScore) {
    return;
  }

  const jobs = Number(capitalJobs.value || 0);
  const payment = Number(capitalPayment.value || 0);
  const repeat = Number(capitalRepeat.value || 0);
  const dispute = Number(capitalDispute.value || 0);
  const jobScore = Math.min(30, jobs * 0.9);
  const paymentScore = payment * 0.34;
  const repeatScore = repeat * 0.24;
  const disputePenalty = dispute * 0.62;
  const score = Math.max(0, Math.min(100, Math.round(jobScore + paymentScore + repeatScore - disputePenalty + 16)));
  const monthlyRevenueSignal = jobs * 280;
  const starterAdvance = Math.max(500, Math.round(monthlyRevenueSignal * 0.22 / 50) * 50);

  capitalPaymentOutput.textContent = payment;
  capitalRepeatOutput.textContent = repeat;
  capitalDisputeOutput.textContent = dispute;
  capitalScore.textContent = score;

  if (score >= 82) {
    capitalBand.textContent = "Ready for equipment or truck financing";
    capitalDetail.textContent = `MovingOS Capital would flag this U.S. moving operator for up to ${money(starterAdvance * 3)} in asset-backed financing, with repayment tied to verified job flow.`;
  } else if (score >= 65) {
    capitalBand.textContent = "Ready for small working-capital advance";
    capitalDetail.textContent = `MovingOS Capital would recommend a starter advance around ${money(starterAdvance)} tied to job volume, repayment timing, and completion consistency.`;
  } else if (score >= 45) {
    capitalBand.textContent = "Build more verified operating history";
    capitalDetail.textContent = "MovingOS would keep routing jobs, tracking payments, and improving reputation before offering larger capital products.";
  } else {
    capitalBand.textContent = "Registration and reliability first";
    capitalDetail.textContent = "The operator needs stronger identity, completion, payment, and dispute records before MovingOS Capital should take balance-sheet risk.";
  }
}

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.scrollTarget}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

form.addEventListener("input", estimate);
form.addEventListener("change", estimate);
generateButton.addEventListener("click", () => {
  estimate();
  generateButton.textContent = "Package generated";
  window.setTimeout(() => {
    generateButton.textContent = "Generate package";
  }, 1600);
});
saveButton.addEventListener("click", saveScenario);
demoButton.addEventListener("click", fillDemo);
revenuePrice?.addEventListener("change", updateRevenueCalculator);
setupFee?.addEventListener("input", updateRevenueCalculator);
capitalJobs?.addEventListener("input", updateCapitalReadiness);
capitalPayment?.addEventListener("input", updateCapitalReadiness);
capitalRepeat?.addEventListener("input", updateCapitalReadiness);
capitalDispute?.addEventListener("input", updateCapitalReadiness);

restoreScenario();
updateRevenueCalculator();
updateCapitalReadiness();

