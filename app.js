const state = {
  content: null,
  view: "home",
  matchStep: 0,
  answers: {},
  category: "All",
  search: ""
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function versionedImageUrl(url) {
  if (!url) return "";
  const revision = state.content?.updatedAt;
  if (!revision) return url;
  return `${url}${url.includes("?") ? "&" : "?"}siteRevision=${encodeURIComponent(revision)}`;
}

function imageStyle(item, type = "bird") {
  if (!item.image) return "";
  const fit = type === "product" ? "contain" : "cover";
  return ` style="background-image:url('${escapeHtml(versionedImageUrl(item.image))}');background-size:${fit};background-position:center;background-repeat:no-repeat"`;
}

function birdImage(item, extra = "") {
  const sprite = Number(item.sprite) || 0;
  return `<div class="species-image sprite-${sprite} ${extra}"${imageStyle(item)}></div>`;
}

function applyBusiness() {
  const business = state.content.business;
  $$('[data-phone]').forEach(el => el.textContent = business.phone);
  $$('[data-phone-link]').forEach(el => el.href = `tel:${business.phone.replace(/\D/g, "")}`);
  const landline = business.landline || "011 272 2418";
  $$('[data-landline]').forEach(el => el.textContent = landline);
  $$('[data-landline-link]').forEach(el => el.href = `tel:${landline.replace(/\D/g, "")}`);
  $$('[data-address]').forEach(el => el.textContent = business.address);
  $$('[data-hours]').forEach(el => el.textContent = business.hours);
  $$('[data-email]').forEach(el => el.textContent = business.email);
  $$('[data-email-link]').forEach(el => el.href = `mailto:${business.email}`);
  $('[data-tagline]').innerHTML = escapeHtml(business.tagline).replace(/\. /, ".<br>");
  $('[data-description]').textContent = business.description;
  $$('[data-whatsapp-link]').forEach(el => el.href = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hello Exopets Colombo, I would like some guidance.")}`);
}

function populateBirdSelects() {
  $$('[data-bird-select]').forEach(select => {
    const first = select.options[0]?.outerHTML || '<option value="">Select bird</option>';
    select.innerHTML = first + state.content.birds.map(bird => `<option value="${escapeHtml(bird.name)}">${escapeHtml(bird.name)}</option>`).join("");
  });
}

function renderSpecies() {
  const birds = state.content.birds.filter(bird => bird.featured).slice(0, 5);
  $('[data-species-grid]').innerHTML = birds.map(bird => `
    <article class="species-card" data-enquire-bird="${escapeHtml(bird.name)}" tabindex="0">
      ${birdImage(bird)}
      <span class="availability ${bird.available ? "" : "waitlist"}">${bird.available ? "Enquire" : "Ask availability"}</span>
      <div class="species-card-content"><h3>${escapeHtml(bird.name)}</h3><p>${escapeHtml(bird.saleType || bird.short)}</p><button type="button">Check availability ›</button></div>
    </article>`).join("");
}

function currentRoute() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  return ({ "/": "home", "/matcher": "matcher", "/dna-testing": "dna", "/care-guides": "guides", "/shop": "shop", "/enquire": "home" })[path] || "home";
}

const routePaths = { home: "/", matcher: "/matcher", dna: "/dna-testing", guides: "/care-guides", shop: "/shop" };

function navigate(view, push = true) {
  state.view = view;
  document.body.dataset.view = view;
  $$('[data-view]').forEach(el => el.classList.toggle("active", el.dataset.view === view));
  $$('[data-route]').forEach(el => el.classList.toggle("active", el.dataset.route === view));
  if (push && location.pathname !== routePaths[view]) history.pushState({ view }, "", routePaths[view]);
  document.title = `${({ home: "The right bird. The right home.", matcher: "Find your bird", dna: "DNA Testing", guides: "Care Guides", shop: "Bird Care Shop" })[view]} — EXOPETS COLOMBO`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  $('#mobileNav').classList.remove("open");
  $('#menuToggle').setAttribute("aria-expanded", "false");
}

function renderMatcher() {
  const questions = state.content.matcher.questions;
  $('[data-matcher-steps]').innerHTML = questions.map((question, index) => `<div class="step ${index === state.matchStep ? "active" : ""} ${index < state.matchStep ? "done" : ""}"><b>${index < state.matchStep ? "✓" : index + 1}</b><span>${escapeHtml(question.id[0].toUpperCase() + question.id.slice(1))}</span></div>`).join("");
  const question = questions[state.matchStep];
  $('[data-question-host]').innerHTML = `<div class="question"><span class="eyebrow">QUESTION ${state.matchStep + 1} OF ${questions.length}</span><h2>${escapeHtml(question.title)}</h2><div class="option-grid">${question.options.map(option => `<button class="option-card ${state.answers[question.id] === option.value ? "selected" : ""}" type="button" data-answer="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>`).join("")}</div></div>`;
  $('[data-match-back]').style.visibility = state.matchStep ? "visible" : "hidden";
  $('[data-match-next]').innerHTML = state.matchStep === questions.length - 1 ? "See my matches <b>›</b>" : "Next <b>›</b>";
  $$('[data-answer]').forEach(button => button.addEventListener("click", () => {
    state.answers[question.id] = button.dataset.answer;
    renderMatcher();
  }));
}

function scoreBird(bird) {
  let score = 0;
  const a = state.answers;
  if (bird.experience?.includes(a.experience)) score += 4;
  if (bird.time === a.time) score += 3; else if ((bird.time === "medium" && a.time === "high") || (bird.time === "low" && ["medium", "high"].includes(a.time))) score += 1;
  if (bird.noise === a.noise) score += 2; else if (bird.noise === "low") score += 1;
  if (bird.home?.includes(a.home)) score += 3;
  return score;
}

function showMatches() {
  const ranked = state.content.birds.map(bird => ({ ...bird, score: scoreBird(bird) })).sort((a, b) => b.score - a.score).slice(0, 3);
  $('[data-recommendation-grid]').innerHTML = ranked.map((bird, index) => `<article class="recommendation-card">${birdImage(bird)}<div><span class="match-score">${index === 0 ? "STRONGEST MATCH" : "ALSO CONSIDER"} · ${bird.score}/12</span><h3>${escapeHtml(bird.name)}</h3><p>${escapeHtml(bird.short)}</p><button class="button button-gold" type="button" data-enquire-bird="${escapeHtml(bird.name)}">Enquire ›</button></div></article>`).join("");
  $('[data-recommendations]').hidden = false;
  $('[data-recommendations]').scrollIntoView({ behavior: "smooth", block: "start" });
}

function careIcon(name) {
  const paths = {
    bird: '<path d="M5 18c4-1 7-4 8-9 4 1 6 4 6 7-3 0-5 1-6 3-2-1-5-1-8-1Zm8-9 2-4m-7 15-1 2m5-3 1 3"/>',
    weight: '<path d="M8 8h8l3 12H5L8 8Zm2 0a2 2 0 1 1 4 0m-4 5c1-2 3-2 4 0"/>',
    heart: '<path d="M12 21S4 16 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 7-6 12-6 12Zm-5-9h3l1-3 2 6 1-3h3"/>',
    calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v6m8-6v6M4 11h16m-6 3-2 2 2 1"/>',
    bowl: '<path d="M4 11h16c0 5-3 8-8 8s-8-3-8-8Zm3-3c1-2 3-3 5-3s4 1 5 3M7 22h10"/>',
    toy: '<path d="M8 5 5 9l3 3m8-7 3 4-3 3M8 12l4 4 4-4M12 3v13m-6 5 2-4m10 4-2-4"/><circle cx="12" cy="3" r="2"/>'
  };
  return `<svg class="care-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.bird}</svg>`;
}

function renderGuides(selectedId) {
  const birdOrder = new Map(state.content.birds.map((bird, index) => [bird.id, index]));
  const guides = [...state.content.guides].sort((a, b) => (birdOrder.get(a.birdId) ?? 999) - (birdOrder.get(b.birdId) ?? 999));
  const selected = guides.find(guide => guide.id === selectedId) || guides[0];
  const tabLabel = guide => guide.title.replace(/\s+Care Guide$/i, "").replace(/^New Bird Home Checklist$/i, "New bird checklist");
  $('[data-guide-list]').innerHTML = guides.map(guide => `<button type="button" class="${guide.id === selected.id ? "active" : ""}" data-guide-id="${escapeHtml(guide.id)}" aria-pressed="${guide.id === selected.id}"><strong>${escapeHtml(tabLabel(guide))}</strong><small>${escapeHtml(guide.intro)}</small></button>`).join("");
  const bird = state.content.birds.find(item => item.id === selected.birdId) || state.content.birds[0];
  const related = state.content.products.filter(product => product.active !== false && product.relatedBirds?.includes(bird.id)).slice(0, 3);
  const facts = [
    ["bird", "Size", bird.size],
    ["weight", "Weight", bird.weight],
    ["heart", "Temperament", bird.temperament],
    ["calendar", "Lifespan", bird.lifespan]
  ];
  const factPanel = selected.birdId === "all" ? "" : `<section class="quick-facts"><h3>Quick facts</h3><div class="fact-grid">${facts.map(([icon, label, value]) => `<div class="fact-item">${careIcon(icon)}<div><span>${label}</span><strong>${escapeHtml(value || "Ask our team")}</strong></div></div>`).join("")}</div></section>
    <div class="care-rows"><article>${careIcon("bowl")}<div><h3>Food</h3><p>${escapeHtml(bird.food)}</p></div><span>›</span></article><article>${careIcon("toy")}<div><h3>Enrichment</h3><p>${escapeHtml(bird.enrichment)}</p></div><span>›</span></article></div>`;
  const relatedPanel = related.length ? `<section class="related-essentials"><h3>Related essentials</h3><div class="related-product-grid">${related.map(product => `<article><div class="related-product-image product-sprite-${Number(product.sprite) || 0}"${imageStyle(product, "product")}></div><small>${escapeHtml(product.category)}</small><h4>${escapeHtml(product.name)}</h4><strong>${money(product.price)}</strong><button type="button" data-enquire-product="${escapeHtml(product.id)}">Enquire</button></article>`).join("")}</div></section>` : "";
  $('[data-guide-detail]').innerHTML = `<div class="guide-cover"><div class="guide-cover-copy"><span class="eyebrow">CARE GUIDE</span><h2>${escapeHtml(selected.title)}</h2><p>${escapeHtml(selected.intro)}</p></div>${birdImage(bird, "guide-cover-bird")}</div><div class="guide-paper">${factPanel}${relatedPanel}<details class="guide-more"><summary>Complete care guidance</summary>${selected.sections.map(section => `<section class="guide-detail-section"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p></section>`).join("")}<p class="care-disclaimer">General guidance only. Diet changes, supplements and health concerns should be discussed with an avian veterinarian.</p></details><button type="button" class="button button-coral" data-enquire-bird="${escapeHtml(bird.name)}">Ask our team a question</button></div>`;
  $$('[data-guide-id]').forEach(button => button.addEventListener("click", () => renderGuides(button.dataset.guideId)));
}

function renderShop() {
  const products = state.content.products.filter(product => product.active !== false);
  const categories = ["All", ...new Set(products.map(product => product.category))];
  $('[data-category-chips]').innerHTML = categories.map(category => `<button type="button" class="${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
  const visible = products.filter(product => (state.category === "All" || product.category === state.category) && `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(state.search.toLowerCase()));
  $('[data-product-grid]').innerHTML = visible.length ? visible.map(product => `<article class="product-card"><div class="product-image product-sprite-${Number(product.sprite) || 0}"${imageStyle(product, "product")}></div><div class="product-card-content"><span class="category">${escapeHtml(product.category).toUpperCase()}</span><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p><footer><span class="price">${money(product.price)}</span><button type="button" data-enquire-product="${escapeHtml(product.id)}">WhatsApp enquiry</button></footer></div></article>`).join("") : `<p>No products match your search.</p>`;
  $$('[data-category]').forEach(button => button.addEventListener("click", () => { state.category = button.dataset.category; renderShop(); }));
}

function enquireProduct(id) {
  const product = state.content.products.find(item => item.id === id);
  if (!product) return;
  const text = `Hello Exopets Colombo, I would like to check availability for ${product.name}${product.price ? ` (${money(product.price)})` : ""}. Can I visit the shop to see it?`;
  window.open(`https://wa.me/${state.content.business.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function openEnquiry(bird = "") {
  const modal = $('[data-modal="enquiry"]');
  const form = $('form', modal);
  form.dataset.requestType = "enquiry";
  if (bird) $('select[name="bird"]', form).value = bird;
  modal.hidden = false;
  document.body.classList.add("no-scroll");
  setTimeout(() => $('input[name="name"]', form).focus(), 50);
}

function closeModal() {
  $('[data-modal="enquiry"]').hidden = true;
  document.body.classList.remove("no-scroll");
}

async function submitRequest(form) {
  const status = $('.form-status', form);
  const button = $('button[type="submit"]', form);
  const data = Object.fromEntries(new FormData(form));
  data.type = form.dataset.requestType || "enquiry";
  if (data.type === "matcher") data.answers = state.answers;
  button.disabled = true;
  status.classList.remove("error");
  status.textContent = "Sending…";
  try {
    const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to send");
    status.textContent = `Received — reference ${result.reference}. We’ll contact you shortly.`;
    showToast("Your request has been sent to Exopets Colombo");
    form.reset();
  } catch (error) {
    status.classList.add("error");
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function bindEvents() {
  document.addEventListener("click", event => {
    const route = event.target.closest('[data-route]');
    if (route) { event.preventDefault(); navigate(route.dataset.route); return; }
    const enquiry = event.target.closest('[data-open-enquiry]');
    if (enquiry) { event.preventDefault(); openEnquiry(); return; }
    const bird = event.target.closest('[data-enquire-bird]');
    if (bird) { event.preventDefault(); openEnquiry(bird.dataset.enquireBird); }
    const product = event.target.closest('[data-enquire-product]');
    if (product) { event.preventDefault(); enquireProduct(product.dataset.enquireProduct); }
  });
  window.addEventListener("popstate", () => navigate(currentRoute(), false));
  $('#menuToggle').addEventListener("click", () => { const open = $('#mobileNav').classList.toggle("open"); $('#menuToggle').setAttribute("aria-expanded", String(open)); });
  $$('[data-close-modal]').forEach(button => button.addEventListener("click", closeModal));
  $('[data-modal="enquiry"]').addEventListener("click", event => { if (event.target === event.currentTarget) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
  $('[data-match-back]').addEventListener("click", () => { if (state.matchStep > 0) { state.matchStep -= 1; renderMatcher(); } });
  $('[data-match-next]').addEventListener("click", () => { const question = state.content.matcher.questions[state.matchStep]; if (!state.answers[question.id]) return showToast("Choose an answer to continue"); if (state.matchStep < state.content.matcher.questions.length - 1) { state.matchStep += 1; renderMatcher(); } else showMatches(); });
  $('[data-match-reset]').addEventListener("click", () => { state.matchStep = 0; state.answers = {}; $('[data-recommendations]').hidden = true; renderMatcher(); window.scrollTo({ top: 260, behavior: "smooth" }); });
  $$('[data-request-form]').forEach(form => form.addEventListener("submit", event => { event.preventDefault(); submitRequest(form); }));
  $$('[data-whatsapp-enquiry]').forEach(button => button.addEventListener("click", () => { const form = button.closest("form"); const data = Object.fromEntries(new FormData(form)); const text = `Hello Exopets Colombo, I am ${data.name || "interested in a bird"}. ${data.bird ? `Bird: ${data.bird}. ` : ""}${data.phone ? `My number is ${data.phone}.` : ""}`; window.open(`https://wa.me/${state.content.business.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener"); }));
  $$('[data-plus]').forEach(button => button.addEventListener("click", () => { const input = button.parentElement.querySelector("input"); input.value = Math.min(20, Number(input.value) + 1); }));
  $$('[data-minus]').forEach(button => button.addEventListener("click", () => { const input = button.parentElement.querySelector("input"); input.value = Math.max(1, Number(input.value) - 1); }));
  $('[data-product-search]').addEventListener("input", event => { state.search = event.target.value; renderShop(); });
}

async function init() {
  try {
    const response = await fetch(`/api/content?revision=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Content unavailable");
    state.content = await response.json();
  } catch (error) {
    document.body.innerHTML = `<main style="padding:10vw;color:white"><h1>EXOPETS COLOMBO</h1><p>We could not load the site content. Please refresh in a moment.</p></main>`;
    return;
  }
  applyBusiness();
  populateBirdSelects();
  renderSpecies();
  renderMatcher();
  renderGuides();
  renderShop();
  bindEvents();
  $('[data-year]').textContent = new Date().getFullYear();
  navigate(currentRoute(), false);
  if (location.pathname === "/enquire") openEnquiry();
}

init();
