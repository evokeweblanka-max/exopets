const admin = { content: null, requests: [], activeTab: "overview", requestFilter: "all", requestSearch: "", dirty: false, uploading: false };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const fmtDate = value => value ? new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const money = value => `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;

function toast(message) {
  const el = $('[data-toast]');
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}

function markDirty() {
  admin.dirty = true;
  $('[data-save-state]').innerHTML = '<span class="unsaved-dot"></span>Unsaved changes';
  $('[data-save-state]').classList.add("unsaved");
}

function markSaved() {
  admin.dirty = false;
  $('[data-save-state]').textContent = "All changes saved";
  $('[data-save-state]').classList.remove("unsaved");
}

function getPath(path) { return path.split(".").reduce((value, key) => value?.[key], admin.content); }
function setPath(path, value) {
  const keys = path.split(".");
  const final = keys.pop();
  const target = keys.reduce((item, key) => item[key], admin.content);
  target[final] = value;
  markDirty();
}

function idFrom(value) {
  return String(value || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `item-${Date.now()}`;
}

function field(label, path, options = {}) {
  const value = getPath(path);
  const cls = options.full ? "admin-field full-row" : "admin-field";
  const note = options.note ? `<small class="inline-note">${esc(options.note)}</small>` : "";
  if (options.type === "textarea") return `<label class="${cls}">${esc(label)}<textarea class="admin-textarea" data-bind="${path}">${esc(value)}</textarea>${note}</label>`;
  if (options.type === "select") return `<label class="${cls}">${esc(label)}<select class="admin-select" data-bind="${path}">${options.values.map(item => `<option value="${esc(item.value)}" ${String(value) === String(item.value) ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select>${note}</label>`;
  return `<label class="${cls}">${esc(label)}<input class="admin-input" data-bind="${path}" value="${esc(Array.isArray(value) ? value.join(", ") : value)}" type="${options.type || "text"}" ${options.transform ? `data-transform="${options.transform}"` : ""} ${options.min != null ? `min="${options.min}"` : ""}>${note}</label>`;
}

function switchField(label, path) {
  return `<label class="switch-field"><input type="checkbox" data-bind="${path}" ${getPath(path) ? "checked" : ""}> ${esc(label)}</label>`;
}

function imageUploader(type, index, image, fit = "cover") {
  return `<div class="admin-field full-row image-upload-field">
    <span>${type === "bird" ? "Bird image" : "Product image"}</span>
    <div class="upload-row">
      <label class="upload-button">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" data-image-upload="${type}" data-index="${index}" data-fit="${fit}"></label>
      ${image ? `<button class="small-button" type="button" data-remove-image="${type}" data-index="${index}">Use built-in image</button>` : ""}
      <small data-upload-status="${type}-${index}">JPG, PNG or WebP. Automatically fitted to a standard 4:3 frame.</small>
    </div>
  </div>`;
}

function renderOverview() {
  const newRequests = admin.requests.filter(item => item.status === "new");
  $('[data-panel="overview"]').innerHTML = `
    <div class="metric-grid">
      <article class="metric-card"><span>AVAILABLE BIRDS</span><strong>${admin.content.birds.filter(item => item.available).length}</strong></article>
      <article class="metric-card"><span>ACTIVE PRODUCTS</span><strong>${admin.content.products.filter(item => item.active).length}</strong></article>
      <article class="metric-card"><span>CARE GUIDES</span><strong>${admin.content.guides.length}</strong></article>
      <article class="metric-card"><span>NEW ENQUIRIES</span><strong>${newRequests.length}</strong></article>
    </div>
    <div class="overview-grid">
      <section class="admin-card"><div class="card-title-row"><h2>Recent enquiries</h2><button class="text-button" data-jump="requests">View all</button></div><div class="request-preview">${admin.requests.slice(0, 5).map(item => `<article><div><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${esc(item.phone)} · ${fmtDate(item.createdAt)}</small></div><span class="status-pill ${item.status}">${esc(item.status)}</span></article>`).join("") || '<p class="empty-state">No enquiries yet.</p>'}</div></section>
      <section class="admin-card"><h2>Quick actions</h2><div class="quick-links"><button data-jump="birds">＋ Add or update birds</button><button data-jump="products">＋ Update products</button><button data-jump="guides">▤ Edit care guides</button><button data-jump="requests">✉ Review enquiries</button></div><p class="inline-note">Last website update: ${fmtDate(admin.content.updatedAt)}</p></section>
    </div>`;
}

function renderBusiness() {
  $('[data-panel="business"]').innerHTML = `<div class="panel-heading"><div><h2>Site details</h2><p>Update contact details and the main website message.</p></div></div><section class="admin-card"><div class="admin-form-grid">
    ${field("Mobile number", "business.phone")}${field("Local landline", "business.landline")}${field("Business name", "business.name")}${field("WhatsApp number", "business.whatsapp", { note: "International format without +, for example 94768331143" })}${field("Email", "business.email", { type: "email" })}${field("Address", "business.address", { full: true })}${field("Opening hours", "business.hours", { full: true })}${field("Main headline", "business.tagline", { full: true })}${field("Homepage description", "business.description", { type: "textarea", full: true })}
  </div></section>`;
}

function renderBirds() {
  $('[data-panel="birds"]').innerHTML = `<div class="panel-heading"><div><h2>Birds</h2><p>Add species, update availability and control care facts shown to customers.</p></div><button class="button button-gold" type="button" data-add="bird">＋ Add bird</button></div><div class="repeat-list">${admin.content.birds.map((bird, i) => `<article class="repeat-card">
    <div class="repeat-head"><div class="image-preview sprite-preview sprite-${Number(bird.sprite) || 0}" ${bird.image ? `style="background-image:url('${esc(bird.image)}')"` : ""}></div><div><h3>${esc(bird.name || "New bird")}</h3><small>${bird.available ? "Available for enquiry" : "Unavailable / ask first"}</small></div><span class="flex-spacer"></span>${switchField("Available", `birds.${i}.available`)}${switchField("Featured", `birds.${i}.featured`)}<button class="danger-button" type="button" data-delete="bird" data-index="${i}">Delete</button></div>
    <div class="repeat-body"><div class="repeat-grid">${field("Name", `birds.${i}.name`)}${field("Slug / ID", `birds.${i}.id`, { note: "Lowercase ID, for example blue-and-gold-macaw" })}${field("Built-in image", `birds.${i}.sprite`, { type: "number", min: 0, note: "Used only when no custom image is uploaded" })}${field("Short description", `birds.${i}.short`, { type: "textarea", full: true })}${field("Availability note", `birds.${i}.saleType`, { full: true })}${field("DNA status", `birds.${i}.dnaStatus`)}${imageUploader("bird", i, bird.image, "cover")}${field("Image URL", `birds.${i}.image`, { full: true, note: "Filled automatically after upload. A direct image URL can also be pasted." })}${field("Experience levels", `birds.${i}.experience`, { transform: "csv", note: "new, some, experienced" })}${field("Daily time", `birds.${i}.time`, { type: "select", values: [{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}] })}${field("Noise level", `birds.${i}.noise`, { type: "select", values: [{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}] })}${field("Home types", `birds.${i}.home`, { transform: "csv", note: "apartment, house" })}${field("Size", `birds.${i}.size`)}${field("Weight", `birds.${i}.weight`)}${field("Temperament", `birds.${i}.temperament`)}${field("Lifespan", `birds.${i}.lifespan`)}${field("Food guidance", `birds.${i}.food`, { type: "textarea" })}${field("Enrichment guidance", `birds.${i}.enrichment`, { type: "textarea" })}</div></div>
  </article>`).join("")}</div>`;
}

function renderProducts() {
  $('[data-panel="products"]').innerHTML = `<div class="panel-heading"><div><h2>Products</h2><p>Manage the owner’s public catalogue. Customers enquire through WhatsApp.</p></div><button class="button button-gold" type="button" data-add="product">＋ Add product</button></div><div class="repeat-list">${admin.content.products.map((product, i) => `<article class="repeat-card">
    <div class="repeat-head"><div class="image-preview product-preview product-sprite-${Number(product.sprite) || 0}" ${product.image ? `style="background-image:url('${esc(product.image)}')"` : ""}></div><div><h3>${esc(product.name || "New product")}</h3><small>${money(product.price)} · ${esc(product.category)}</small></div><span class="flex-spacer"></span>${switchField("Visible", `products.${i}.active`)}<button class="danger-button" type="button" data-delete="product" data-index="${i}">Delete</button></div>
    <div class="repeat-body"><div class="repeat-grid">${field("Name", `products.${i}.name`)}${field("Slug / ID", `products.${i}.id`)}${field("Category", `products.${i}.category`)}${field("Price (Rs.)", `products.${i}.price`, { type: "number", min: 0 })}${field("Built-in image", `products.${i}.sprite`, { type: "number", min: 0, note: "Used only when no custom image is uploaded" })}${field("Related bird IDs", `products.${i}.relatedBirds`, { transform: "csv" })}${imageUploader("product", i, product.image, "contain")}${field("Image URL", `products.${i}.image`, { full: true, note: "Filled automatically after upload. A direct image URL can also be pasted." })}${field("Description", `products.${i}.description`, { type: "textarea", full: true })}</div></div>
  </article>`).join("")}</div>`;
}

function renderGuides() {
  $('[data-panel="guides"]').innerHTML = `<div class="panel-heading"><div><h2>Care guides</h2><p>Edit the practical guidance customers see for each bird.</p></div><button class="button button-gold" type="button" data-add="guide">＋ Add guide</button></div><div class="repeat-list">${admin.content.guides.map((guide, i) => `<article class="repeat-card"><div class="repeat-head"><div><h3>${esc(guide.title || "New guide")}</h3><small>${guide.sections?.length || 0} sections</small></div><span class="flex-spacer"></span><button class="danger-button" type="button" data-delete="guide" data-index="${i}">Delete</button></div><div class="repeat-body"><div class="admin-form-grid">${field("Title", `guides.${i}.title`)}${field("Slug / ID", `guides.${i}.id`)}${field("Related bird ID", `guides.${i}.birdId`, { note: "Use all for a general guide" })}${field("Introduction", `guides.${i}.intro`, { type: "textarea", full: true })}</div><h3 class="subsection-title">Guide sections</h3><div class="section-list">${(guide.sections || []).map((section, j) => `<div class="section-editor">${field("Section title", `guides.${i}.sections.${j}.title`)}${field("Section content", `guides.${i}.sections.${j}.body`, { type: "textarea" })}<button class="danger-button" type="button" data-delete-section="${i}" data-section-index="${j}" aria-label="Delete section">×</button></div>`).join("")}</div><button class="add-button" type="button" data-add-section="${i}">＋ Add section</button></div></article>`).join("")}</div>`;
}

function renderMatcher() {
  $('[data-panel="matcher"]').innerHTML = `<div class="panel-heading"><div><h2>Bird matcher</h2><p>Update questions and answer labels. Matching attributes are set inside each bird.</p></div></div><div class="repeat-list">${admin.content.matcher.questions.map((question, i) => `<article class="repeat-card"><div class="repeat-head"><b>${i + 1}</b><h3>${esc(question.title)}</h3></div><div class="repeat-body"><div class="admin-form-grid">${field("Question title", `matcher.questions.${i}.title`, { full: true })}${question.options.map((option, j) => `${field(`Answer ${j + 1} label`, `matcher.questions.${i}.options.${j}.label`)}${field(`Answer ${j + 1} value`, `matcher.questions.${i}.options.${j}.value`)}`).join("")}</div></div></article>`).join("")}</div>`;
}

function renderRequests() {
  const query = admin.requestSearch.trim().toLowerCase();
  const filtered = admin.requests.filter(item => (admin.requestFilter === "all" || item.type === admin.requestFilter || item.status === admin.requestFilter) && (!query || `${item.name} ${item.phone} ${item.email} ${item.bird} ${item.message}`.toLowerCase().includes(query)));
  const filters = ["all", "new", "enquiry", "matcher", "dna", "contacted", "closed"];
  $('[data-panel="requests"]').innerHTML = `<div class="panel-heading"><div><h2>Customer enquiries</h2><p>Bird enquiries, matcher follow-ups and DNA-test requests.</p></div><button class="small-button" type="button" data-refresh-requests>↻ Refresh</button></div><div class="request-controls"><div class="request-toolbar">${filters.map(filter => `<button class="${admin.requestFilter === filter ? "active" : ""}" data-request-filter="${filter}">${filter[0].toUpperCase() + filter.slice(1)}</button>`).join("")}</div><label class="request-search">⌕ <input data-request-search value="${esc(admin.requestSearch)}" placeholder="Search name, number or bird"></label></div><div class="request-table-wrap">${filtered.length ? `<table class="request-table"><thead><tr><th>DATE</th><th>TYPE</th><th>CUSTOMER</th><th>BIRD / DETAILS</th><th>MESSAGE</th><th>STATUS</th><th></th></tr></thead><tbody>${filtered.map(item => `<tr><td>${fmtDate(item.createdAt)}</td><td><span class="type-pill">${esc(item.type)}</span></td><td><strong>${esc(item.name)}</strong><small>${esc(item.phone)}</small><small>${esc(item.email)}</small></td><td><strong>${esc(item.bird || "—")}</strong><small>${item.quantity ? `${item.quantity} bird(s)` : ""} ${esc(item.preference || "")}</small></td><td>${esc(item.message || "—")}</td><td><select class="admin-select" data-request-status="${esc(item.id)}"><option value="new" ${item.status === "new" ? "selected" : ""}>New</option><option value="contacted" ${item.status === "contacted" ? "selected" : ""}>Contacted</option><option value="closed" ${item.status === "closed" ? "selected" : ""}>Closed</option></select></td><td><button class="icon-danger" type="button" data-delete-request="${esc(item.id)}" aria-label="Delete enquiry">×</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty-state">No enquiries in this view.</div>'}</div>`;
}

function renderAll() { renderOverview(); renderBusiness(); renderBirds(); renderProducts(); renderGuides(); renderMatcher(); renderRequests(); updateNewCount(); }
function updateNewCount() { $('[data-new-count]').textContent = admin.requests.filter(item => item.status === "new").length; }

function showTab(tab) {
  admin.activeTab = tab;
  $$('[data-panel]').forEach(panel => panel.classList.toggle("active", panel.dataset.panel === tab));
  $$('[data-tab]').forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
  $('[data-admin-title]').textContent = ({ overview: "Overview", business: "Site details", birds: "Birds", products: "Products", guides: "Care guides", matcher: "Bird matcher", requests: "Enquiries" })[tab];
  $('.admin-sidebar').classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindAdminEvents() {
  $('[data-admin-nav]').addEventListener("click", event => { const button = event.target.closest('[data-tab]'); if (button) showTab(button.dataset.tab); });
  document.addEventListener("click", event => {
    const jump = event.target.closest('[data-jump]'); if (jump) return showTab(jump.dataset.jump);
    const add = event.target.closest('[data-add]'); if (add) return addItem(add.dataset.add);
    const del = event.target.closest('[data-delete]'); if (del) return deleteItem(del.dataset.delete, Number(del.dataset.index));
    const removeImage = event.target.closest('[data-remove-image]'); if (removeImage) return removeImageFromItem(removeImage.dataset.removeImage, Number(removeImage.dataset.index));
    const addSection = event.target.closest('[data-add-section]'); if (addSection) { admin.content.guides[Number(addSection.dataset.addSection)].sections.push({ title: "New section", body: "" }); markDirty(); renderGuides(); return; }
    const deleteSection = event.target.closest('[data-delete-section]'); if (deleteSection) { if (!confirm("Delete this guide section?")) return; admin.content.guides[Number(deleteSection.dataset.deleteSection)].sections.splice(Number(deleteSection.dataset.sectionIndex), 1); markDirty(); renderGuides(); return; }
    const filter = event.target.closest('[data-request-filter]'); if (filter) { admin.requestFilter = filter.dataset.requestFilter; renderRequests(); return; }
    const deleteRequest = event.target.closest('[data-delete-request]'); if (deleteRequest) return deleteRequestItem(deleteRequest.dataset.deleteRequest);
    if (event.target.closest('[data-refresh-requests]')) loadRequests();
  });
  document.addEventListener("input", event => {
    const input = event.target.closest('[data-bind]');
    if (input) {
      let value = input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
      if (input.dataset.transform === "csv") value = String(value).split(",").map(x => x.trim()).filter(Boolean);
      setPath(input.dataset.bind, value);
      return;
    }
    if (event.target.matches('[data-request-search]')) { admin.requestSearch = event.target.value; clearTimeout(admin.searchTimer); admin.searchTimer = setTimeout(renderRequests, 180); }
  });
  document.addEventListener("change", event => {
    const status = event.target.closest('[data-request-status]'); if (status) return updateRequestStatus(status.dataset.requestStatus, status.value);
    const upload = event.target.closest('[data-image-upload]'); if (upload?.files?.[0]) uploadImage(upload);
  });
  $('[data-save]').addEventListener("click", saveContent);
  $('[data-logout]').addEventListener("click", logout);
  $('[data-admin-menu]').addEventListener("click", () => $('.admin-sidebar').classList.toggle("open"));
  window.addEventListener("beforeunload", event => { if (admin.dirty) { event.preventDefault(); event.returnValue = ""; } });
}

function addItem(type) {
  if (type === "bird") admin.content.birds.push({ id: idFrom(`bird-${Date.now()}`), name: "New bird", short: "", saleType: "Enquire for current availability", dnaStatus: "DNA testing available", experience: ["some"], time: "medium", noise: "medium", home: ["house"], sprite: 0, featured: true, available: true, size: "", weight: "", temperament: "", lifespan: "", food: "", enrichment: "", image: "" });
  if (type === "product") admin.content.products.push({ id: idFrom(`product-${Date.now()}`), name: "New product", category: "Bird care", price: 0, description: "", sprite: 0, active: true, relatedBirds: [], image: "" });
  if (type === "guide") admin.content.guides.push({ id: idFrom(`guide-${Date.now()}`), birdId: "all", title: "New care guide", intro: "", sections: [{ title: "Overview", body: "" }] });
  markDirty();
  if (type === "bird") renderBirds(); else if (type === "product") renderProducts(); else renderGuides();
}

function deleteItem(type, index) {
  if (!confirm(`Delete this ${type}? It will be removed from the website after you save.`)) return;
  const key = type === "bird" ? "birds" : type === "product" ? "products" : "guides";
  admin.content[key].splice(index, 1);
  markDirty();
  if (type === "bird") renderBirds(); else if (type === "product") renderProducts(); else renderGuides();
}

function removeImageFromItem(type, index) {
  const collection = type === "bird" ? admin.content.birds : admin.content.products;
  collection[index].image = "";
  markDirty();
  type === "bird" ? renderBirds() : renderProducts();
}

async function normalizeImage(file, fit) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a JPG, PNG or WebP image");
  if (file.size > 12 * 1024 * 1024) throw new Error("Image must be smaller than 12 MB");
  const bitmap = await createImageBitmap(file);
  const width = 1400, height = 1050;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = fit === "contain" ? "#f7f0e3" : "#063325"; ctx.fillRect(0, 0, width, height);
  const scale = fit === "contain" ? Math.min(width / bitmap.width, height / bitmap.height) : Math.max(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale, drawHeight = bitmap.height * scale;
  ctx.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  bitmap.close?.();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", .86));
  if (!blob) throw new Error("Could not prepare this image");
  return blob;
}

async function uploadImage(input) {
  const type = input.dataset.imageUpload;
  const index = Number(input.dataset.index);
  const status = $(`[data-upload-status="${type}-${index}"]`);
  admin.uploading = true; input.disabled = true; status.textContent = "Preparing and uploading…";
  try {
    const blob = await normalizeImage(input.files[0], input.dataset.fit);
    const filename = idFrom(input.files[0].name.replace(/\.[^.]+$/, ""));
    const response = await fetch(`/api/upload?kind=${encodeURIComponent(type)}&name=${encodeURIComponent(filename)}`, { method: "POST", headers: { "Content-Type": "image/webp" }, body: blob });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed");
    const collection = type === "bird" ? admin.content.birds : admin.content.products;
    collection[index].image = result.url;
    markDirty();
    type === "bird" ? renderBirds() : renderProducts();
    toast("Image uploaded — save the website to publish it");
  } catch (error) { status.textContent = error.message; toast(error.message); }
  finally { admin.uploading = false; input.disabled = false; input.value = ""; }
}

async function saveContent() {
  if (admin.uploading) return toast("Wait for the image upload to finish");
  const button = $('[data-save]'); button.disabled = true; $('[data-save-state]').textContent = "Saving…";
  try {
    const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(admin.content) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Save failed");
    admin.content.updatedAt = result.savedAt; markSaved(); renderOverview(); toast("Website saved and published");
  } catch (error) { $('[data-save-state]').textContent = error.message; $('[data-save-state]').classList.add("unsaved"); toast(error.message); }
  finally { button.disabled = false; }
}

async function loadRequests(showMessage = true) {
  try {
    const response = await fetch("/api/requests", { cache: "no-store" });
    if (response.status === 401) return showLogin();
    if (!response.ok) throw new Error();
    admin.requests = await response.json(); renderRequests(); renderOverview(); updateNewCount(); if (showMessage) toast("Enquiries refreshed");
  } catch { toast("Could not refresh enquiries"); }
}

async function updateRequestStatus(id, status) {
  try {
    const response = await fetch("/api/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!response.ok) throw new Error();
    const item = admin.requests.find(request => request.id === id); if (item) item.status = status;
    updateNewCount(); renderOverview(); toast("Enquiry status updated");
  } catch { toast("Could not update the enquiry"); renderRequests(); }
}

async function deleteRequestItem(id) {
  if (!confirm("Permanently delete this enquiry?")) return;
  try {
    const response = await fetch("/api/requests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) throw new Error();
    admin.requests = admin.requests.filter(item => item.id !== id); renderRequests(); renderOverview(); updateNewCount(); toast("Enquiry deleted");
  } catch { toast("Could not delete the enquiry"); }
}

function resetAdminScroll() { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }
function showLogin() { $('[data-admin-app]').hidden = true; $('[data-login-shell]').hidden = false; resetAdminScroll(); }
function showAdmin() { $('[data-login-shell]').hidden = true; $('[data-admin-app]').hidden = false; resetAdminScroll(); }

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget, status = $('.form-status', form), button = $('button', form);
  button.disabled = true; status.classList.remove("error"); status.textContent = "Signing in…";
  try {
    const credentials = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Sign in failed");
    form.reset(); await bootAdmin();
  } catch (error) { status.classList.add("error"); status.textContent = error.message; }
  finally { button.disabled = false; }
}

async function logout() { await fetch("/api/logout", { method: "POST" }); location.reload(); }

async function bootAdmin() {
  const [contentResponse, requestsResponse] = await Promise.all([fetch(`/api/content?revision=${Date.now()}`, { cache: "no-store" }), fetch("/api/requests", { cache: "no-store" })]);
  if (requestsResponse.status === 401) return showLogin();
  if (!contentResponse.ok || !requestsResponse.ok) throw new Error("Could not load the dashboard");
  admin.content = await contentResponse.json(); admin.content.business.landline ||= "011 272 2418"; admin.requests = await requestsResponse.json();
  showAdmin(); renderAll(); markSaved(); showTab("overview");
}

async function init() {
  $('[data-login-form]').addEventListener("submit", login); bindAdminEvents();
  try { const response = await fetch("/api/session", { cache: "no-store" }); if (response.ok) await bootAdmin(); else showLogin(); }
  catch { showLogin(); }
}

init();
