const admin = { content: null, requests: [], marketplace: { sellers: [], products: [] }, activeTab: "overview", requestFilter: "all", dirty: false };
const marketplaceConfig = globalThis.EXOPETS_MARKETPLACE;
const marketplaceClient = globalThis.supabase.createClient(marketplaceConfig.url, marketplaceConfig.publishableKey, { auth: { persistSession: true, autoRefreshToken: true } });
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const fmtDate = value => value ? new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const money = value => `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;

function toast(message) { const el = $('[data-toast]'); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3000); }
function markDirty() { admin.dirty = true; $('[data-save-state]').innerHTML = '<span class="unsaved-dot"></span>Unsaved changes'; $('[data-save-state]').classList.add("unsaved"); }
function markSaved() { admin.dirty = false; $('[data-save-state]').textContent = "All changes saved"; $('[data-save-state]').classList.remove("unsaved"); }

function getPath(path) { return path.split(".").reduce((value, key) => value?.[key], admin.content); }
function setPath(path, value) { const keys = path.split("."); const final = keys.pop(); const target = keys.reduce((item, key) => item[key], admin.content); target[final] = value; markDirty(); }
function idFrom(value) { return String(value || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `item-${Date.now()}`; }

function field(label, path, options = {}) {
  const value = getPath(path);
  const cls = options.full ? "admin-field full-row" : "admin-field";
  if (options.type === "textarea") return `<label class="${cls}">${esc(label)}<textarea class="admin-textarea" data-bind="${path}" ${options.placeholder ? `placeholder="${esc(options.placeholder)}"` : ""}>${esc(value)}</textarea>${options.note ? `<small class="inline-note">${esc(options.note)}</small>` : ""}</label>`;
  if (options.type === "select") return `<label class="${cls}">${esc(label)}<select class="admin-select" data-bind="${path}">${options.values.map(item => `<option value="${esc(item.value)}" ${String(value) === String(item.value) ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select></label>`;
  return `<label class="${cls}">${esc(label)}<input class="admin-input" data-bind="${path}" value="${esc(Array.isArray(value) ? value.join(", ") : value)}" type="${options.type || "text"}" ${options.transform ? `data-transform="${options.transform}"` : ""} ${options.min != null ? `min="${options.min}"` : ""}>${options.note ? `<small class="inline-note">${esc(options.note)}</small>` : ""}</label>`;
}

function switchField(label, path) { return `<label class="switch-field"><input type="checkbox" data-bind="${path}" ${getPath(path) ? "checked" : ""}> ${esc(label)}</label>`; }

function renderOverview() {
  const newRequests = admin.requests.filter(item => item.status === "new");
  const today = new Date().toDateString();
  const todayRequests = admin.requests.filter(item => new Date(item.createdAt).toDateString() === today);
  $('[data-panel="overview"]').innerHTML = `
    <div class="metric-grid">
      <article class="metric-card"><span>ACTIVE BIRDS</span><strong>${admin.content.birds.filter(item => item.available).length}</strong></article>
      <article class="metric-card"><span>ACTIVE PRODUCTS</span><strong>${admin.content.products.filter(item => item.active).length}</strong></article>
      <article class="metric-card"><span>NEW REQUESTS</span><strong>${newRequests.length}</strong></article>
      <article class="metric-card"><span>SELLER REVIEWS</span><strong>${admin.marketplace.sellers.filter(item => item.status === "pending").length + admin.marketplace.products.filter(item => item.status === "pending").length}</strong></article>
    </div>
    <div class="overview-grid">
      <section class="admin-card"><h2>Recent customer requests</h2><div class="request-preview">${admin.requests.slice(0, 5).map(item => `<article><div><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${esc(item.phone)} · ${fmtDate(item.createdAt)}</small></div><span class="status-pill ${item.status}">${esc(item.status)}</span></article>`).join("") || '<p class="empty-state">No requests yet.</p>'}</div></section>
      <section class="admin-card"><h2>Quick actions</h2><div class="quick-links"><button data-jump="birds">＋ Add or edit birds</button><button data-jump="products">＋ Update products</button><button data-jump="sellers">♙ Approve sellers</button><button data-jump="marketplace">▦ Review seller products</button><button data-jump="guides">▤ Edit care guides</button><button data-jump="requests">✉ Review requests</button></div><p class="inline-note">Last content update: ${fmtDate(admin.content.updatedAt)}</p></section>
    </div>`;
}

function renderSellers() {
  const sellers = admin.marketplace.sellers;
  $('[data-panel="sellers"]').innerHTML = `<div class="panel-heading"><div><h2>Seller approvals</h2><p>Review every independent seller before their products can be submitted or published.</p></div><button class="small-button" type="button" data-refresh-marketplace>↻ Refresh</button></div><div class="moderation-list">${sellers.length ? sellers.map(seller => `<article class="moderation-card"><div class="moderation-main"><span class="status-pill ${esc(seller.status)}">${esc(seller.status)}</span><h3>${esc(seller.business_name || "Unnamed business")}</h3><p><strong>${esc(seller.contact_name)}</strong> · ${esc(seller.email)}</p><p>${esc(seller.phone)} ${seller.whatsapp ? `· WhatsApp ${esc(seller.whatsapp)}` : ""}</p><p>${esc(seller.address)}</p><small>${Number(seller.product_count || 0)} product(s) · Joined ${fmtDate(seller.created_at)}</small>${seller.rejection_reason ? `<div class="review-note">${esc(seller.rejection_reason)}</div>` : ""}</div><div class="moderation-actions"><button class="approve" data-market-action="approve" data-market-entity="seller" data-market-id="${seller.user_id}">Approve</button><button data-market-action="pending" data-market-entity="seller" data-market-id="${seller.user_id}">Set pending</button><button class="reject" data-market-action="reject" data-market-entity="seller" data-market-id="${seller.user_id}">Reject</button><button class="reject" data-market-action="suspend" data-market-entity="seller" data-market-id="${seller.user_id}">Suspend</button></div></article>`).join("") : '<div class="empty-state">No sellers have registered yet.</div>'}</div>`;
}

function renderMarketplaceProducts() {
  const products = admin.marketplace.products;
  const cfg = globalThis.EXOPETS_MARKETPLACE;
  const imageUrl = path => path && cfg ? `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${path}` : "";
  $('[data-panel="marketplace"]').innerHTML = `<div class="panel-heading"><div><h2>Seller products</h2><p>Only approved products from approved sellers appear in the public shop.</p></div><button class="small-button" type="button" data-refresh-marketplace>↻ Refresh</button></div><div class="moderation-list">${products.length ? products.map(product => { const image = (product.images || [])[0]; return `<article class="moderation-card product-review-card"><div class="moderation-image" style="background-image:url('${esc(imageUrl(image?.storage_path))}')"></div><div class="moderation-main"><span class="status-pill ${esc(product.status)}">${esc(product.status)}</span><h3>${esc(product.name)}</h3><p>${esc(product.business_name)} · ${esc(product.email)}</p><p>${esc(product.category)} · ${money(product.price)} · ${Number(product.stock)} in stock</p><p>${esc(product.description)}</p>${product.rejection_reason ? `<div class="review-note">${esc(product.rejection_reason)}</div>` : ""}<small>Submitted ${fmtDate(product.submitted_at || product.created_at)}</small></div><div class="moderation-actions"><button class="approve" data-market-action="approve" data-market-entity="product" data-market-id="${product.id}">Approve & publish</button><button class="reject" data-market-action="reject" data-market-entity="product" data-market-id="${product.id}">Reject</button><button data-market-action="hide" data-market-entity="product" data-market-id="${product.id}">Hide</button><button data-market-action="show" data-market-entity="product" data-market-id="${product.id}">Show</button></div></article>` }).join("") : '<div class="empty-state">No seller products have been created yet.</div>'}</div>`;
}

function renderBusiness() {
  $('[data-panel="business"]').innerHTML = `<div class="panel-heading"><div><h2>Site details</h2><p>Update the public identity and contact information shown across the website.</p></div></div><section class="admin-card"><div class="admin-form-grid">
    ${field("Mobile number", "business.phone")}${field("Local landline", "business.landline", { note: "Displayed separately in the website contact section" })}${field("Business name", "business.name")}${field("WhatsApp number", "business.whatsapp", { note: "International format without +, for example 94768331143" })}${field("Email", "business.email", { type: "email" })}${field("Address", "business.address", { full: true })}${field("Opening hours", "business.hours", { full: true })}${field("Main headline", "business.tagline", { full: true })}${field("Homepage description", "business.description", { type: "textarea", full: true })}
  </div></section>`;
}

function renderBirds() {
  $('[data-panel="birds"]').innerHTML = `<div class="panel-heading"><div><h2>Birds</h2><p>Control species, matcher attributes, availability and care facts.</p></div><button class="button button-gold" type="button" data-add="bird">＋ Add bird</button></div><div class="repeat-list">${admin.content.birds.map((bird, i) => `<article class="repeat-card">
    <div class="repeat-head"><div class="image-preview sprite-preview sprite-${Number(bird.sprite) || 0}" ${bird.image ? `style="background-image:url('${esc(bird.image)}');background-size:cover"` : ""}></div><div><h3>${esc(bird.name || "New bird")}</h3><small>${esc(bird.id)}</small></div><span style="flex:1"></span>${switchField("Available", `birds.${i}.available`)}${switchField("Featured", `birds.${i}.featured`)}<button class="danger-button" type="button" data-delete="bird" data-index="${i}">Delete</button></div>
    <div class="repeat-body"><div class="repeat-grid">${field("Name", `birds.${i}.name`)}${field("Slug / ID", `birds.${i}.id`)}${field("Sprite position", `birds.${i}.sprite`, { type: "number", min: 0, note: "0–4 for the included bird image strip" })}${field("Short description", `birds.${i}.short`, { type: "textarea", full: true })}${field("Live-sale / availability note", `birds.${i}.saleType`, { full: true, note: "Shown prominently on the live-parrot card" })}${field("DNA status", `birds.${i}.dnaStatus`)}${field("Custom image URL", `birds.${i}.image`, { full: true, note: "Optional. Leave blank to use the built-in species image." })}${field("Experience levels", `birds.${i}.experience`, { transform: "csv", note: "new, some, experienced" })}${field("Daily time", `birds.${i}.time`, { type: "select", values: [{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}] })}${field("Noise level", `birds.${i}.noise`, { type: "select", values: [{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}] })}${field("Home types", `birds.${i}.home`, { transform: "csv", note: "apartment, house" })}${field("Size", `birds.${i}.size`)}${field("Weight", `birds.${i}.weight`)}${field("Temperament", `birds.${i}.temperament`)}${field("Lifespan", `birds.${i}.lifespan`)}${field("Food guidance", `birds.${i}.food`, { type: "textarea" })}${field("Enrichment guidance", `birds.${i}.enrichment`, { type: "textarea" })}</div></div>
  </article>`).join("")}</div>`;
}

function renderProducts() {
  $('[data-panel="products"]').innerHTML = `<div class="panel-heading"><div><h2>Products</h2><p>Manage the public bird-care catalogue and pricing.</p></div><button class="button button-gold" type="button" data-add="product">＋ Add product</button></div><div class="repeat-list">${admin.content.products.map((product, i) => `<article class="repeat-card">
    <div class="repeat-head"><div class="image-preview product-preview product-sprite-${Number(product.sprite) || 0}" ${product.image ? `style="background-image:url('${esc(product.image)}');background-size:contain;background-position:center;background-repeat:no-repeat"` : ""}></div><div><h3>${esc(product.name || "New product")}</h3><small>${money(product.price)}</small></div><span style="flex:1"></span>${switchField("Active", `products.${i}.active`)}<button class="danger-button" type="button" data-delete="product" data-index="${i}">Delete</button></div>
    <div class="repeat-body"><div class="repeat-grid">${field("Name", `products.${i}.name`)}${field("Slug / ID", `products.${i}.id`)}${field("Category", `products.${i}.category`)}${field("Price (Rs.)", `products.${i}.price`, { type: "number", min: 0 })}${field("Sprite position", `products.${i}.sprite`, { type: "number", min: 0, note: "0–2 for the included product image strip" })}${field("Related bird IDs", `products.${i}.relatedBirds`, { transform: "csv" })}${field("Custom image URL", `products.${i}.image`, { full: true })}${field("Description", `products.${i}.description`, { type: "textarea", full: true })}</div></div>
  </article>`).join("")}</div>`;
}

function renderGuides() {
  $('[data-panel="guides"]').innerHTML = `<div class="panel-heading"><div><h2>Care guides</h2><p>Edit guide summaries and detailed care sections.</p></div><button class="button button-gold" type="button" data-add="guide">＋ Add guide</button></div><div class="repeat-list">${admin.content.guides.map((guide, i) => `<article class="repeat-card"><div class="repeat-head"><div><h3>${esc(guide.title || "New guide")}</h3><small>${guide.sections?.length || 0} sections</small></div><span style="flex:1"></span><button class="danger-button" type="button" data-delete="guide" data-index="${i}">Delete</button></div><div class="repeat-body"><div class="admin-form-grid">${field("Title", `guides.${i}.title`)}${field("Slug / ID", `guides.${i}.id`)}${field("Related bird ID", `guides.${i}.birdId`)}${field("Introduction", `guides.${i}.intro`, { type: "textarea", full: true })}</div><h3 style="margin-top:25px">Guide sections</h3><div class="section-list">${(guide.sections || []).map((section, j) => `<div class="section-editor">${field("Section title", `guides.${i}.sections.${j}.title`)}${field("Section content", `guides.${i}.sections.${j}.body`, { type: "textarea" })}<button class="danger-button" type="button" data-delete-section="${i}" data-section-index="${j}">×</button></div>`).join("")}</div><button class="add-button" type="button" data-add-section="${i}">＋ Add section</button></div></article>`).join("")}</div>`;
}

function renderMatcher() {
  $('[data-panel="matcher"]').innerHTML = `<div class="panel-heading"><div><h2>Bird matcher</h2><p>Update the questions and answer labels. Bird matching attributes are managed inside each bird.</p></div></div><div class="repeat-list">${admin.content.matcher.questions.map((question, i) => `<article class="repeat-card"><div class="repeat-head"><b>${i + 1}</b><h3>${esc(question.title)}</h3></div><div class="repeat-body"><div class="admin-form-grid">${field("Question title", `matcher.questions.${i}.title`, { full: true })}${question.options.map((option, j) => `${field(`Answer ${j + 1} label`, `matcher.questions.${i}.options.${j}.label`)}${field(`Answer ${j + 1} value`, `matcher.questions.${i}.options.${j}.value`)}`).join("")}</div></div></article>`).join("")}</div>`;
}

function renderRequests() {
  const filtered = admin.requests.filter(item => admin.requestFilter === "all" || item.type === admin.requestFilter || item.status === admin.requestFilter);
  const filters = ["all", "new", "enquiry", "matcher", "dna", "order", "contacted"];
  $('[data-panel="requests"]').innerHTML = `<div class="panel-heading"><div><h2>Customer requests</h2><p>Bird enquiries, matcher follow-ups, DNA requests and product orders.</p></div><button class="small-button" type="button" data-refresh-requests>↻ Refresh</button></div><div class="request-toolbar">${filters.map(filter => `<button class="${admin.requestFilter === filter ? "active" : ""}" data-request-filter="${filter}">${filter[0].toUpperCase() + filter.slice(1)}</button>`).join("")}</div><div class="request-table-wrap">${filtered.length ? `<table class="request-table"><thead><tr><th>DATE</th><th>TYPE</th><th>CUSTOMER</th><th>INTEREST / DETAILS</th><th>MESSAGE / ORDER</th><th>STATUS</th></tr></thead><tbody>${filtered.map(item => `<tr><td>${fmtDate(item.createdAt)}</td><td><span class="type-pill">${esc(item.type)}</span></td><td><strong>${esc(item.name)}</strong><small>${esc(item.phone)}</small><small>${esc(item.email)}</small></td><td><strong>${esc(item.bird || "—")}</strong><small>${item.quantity ? `${item.quantity} bird(s)` : ""} ${esc(item.preference || "")}</small></td><td>${esc(item.message || "—")}${item.cart?.length ? `<small>${item.cart.map(line => `${line.quantity} × ${esc(line.name)}`).join(" · ")}</small>` : ""}</td><td><select class="admin-select" data-request-status="${esc(item.id)}"><option value="new" ${item.status === "new" ? "selected" : ""}>New</option><option value="contacted" ${item.status === "contacted" ? "selected" : ""}>Contacted</option><option value="closed" ${item.status === "closed" ? "selected" : ""}>Closed</option></select></td></tr>`).join("")}</tbody></table>` : '<div class="empty-state">No requests in this view.</div>'}</div>`;
}

function renderAll() { renderOverview(); renderBusiness(); renderBirds(); renderProducts(); renderSellers(); renderMarketplaceProducts(); renderGuides(); renderMatcher(); renderRequests(); updateNewCount(); }
function updateNewCount() { $('[data-new-count]').textContent = admin.requests.filter(item => item.status === "new").length; $('[data-seller-count]').textContent = admin.marketplace.sellers.filter(item => item.status === "pending").length; $('[data-product-review-count]').textContent = admin.marketplace.products.filter(item => item.status === "pending").length; }

function showTab(tab) {
  admin.activeTab = tab;
  $$('[data-panel]').forEach(panel => panel.classList.toggle("active", panel.dataset.panel === tab));
  $$('[data-tab]').forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
  $('[data-admin-title]').textContent = ({ overview: "Overview", business: "Site details", birds: "Birds", products: "House products", sellers: "Sellers", marketplace: "Seller products", guides: "Care guides", matcher: "Bird matcher", requests: "Requests" })[tab];
  $('.admin-sidebar').classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindAdminEvents() {
  $('[data-admin-nav]').addEventListener("click", event => { const button = event.target.closest('[data-tab]'); if (button) showTab(button.dataset.tab); });
  document.addEventListener("click", event => {
    const jump = event.target.closest('[data-jump]'); if (jump) return showTab(jump.dataset.jump);
    const add = event.target.closest('[data-add]'); if (add) return addItem(add.dataset.add);
    const del = event.target.closest('[data-delete]'); if (del) return deleteItem(del.dataset.delete, Number(del.dataset.index));
    const addSection = event.target.closest('[data-add-section]'); if (addSection) { admin.content.guides[Number(addSection.dataset.addSection)].sections.push({ title: "New section", body: "" }); markDirty(); renderGuides(); return; }
    const deleteSection = event.target.closest('[data-delete-section]'); if (deleteSection) { admin.content.guides[Number(deleteSection.dataset.deleteSection)].sections.splice(Number(deleteSection.dataset.sectionIndex), 1); markDirty(); renderGuides(); return; }
    const filter = event.target.closest('[data-request-filter]'); if (filter) { admin.requestFilter = filter.dataset.requestFilter; renderRequests(); return; }
    const moderation = event.target.closest('[data-market-action]'); if (moderation) return moderateMarketplace(moderation.dataset.marketEntity, moderation.dataset.marketId, moderation.dataset.marketAction);
    if (event.target.closest('[data-refresh-requests]')) loadRequests();
    if (event.target.closest('[data-refresh-marketplace]')) loadMarketplace();
  });
  document.addEventListener("input", event => {
    const input = event.target.closest('[data-bind]'); if (!input) return;
    let value = input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
    if (input.dataset.transform === "csv") value = String(value).split(",").map(x => x.trim()).filter(Boolean);
    setPath(input.dataset.bind, value);
  });
  document.addEventListener("change", event => { const status = event.target.closest('[data-request-status]'); if (status) updateRequestStatus(status.dataset.requestStatus, status.value); });
  $('[data-save]').addEventListener("click", saveContent);
  $('[data-logout]').addEventListener("click", logout);
  $('[data-admin-menu]').addEventListener("click", () => $('.admin-sidebar').classList.toggle("open"));
  window.addEventListener("beforeunload", event => { if (admin.dirty) { event.preventDefault(); event.returnValue = ""; } });
}

function addItem(type) {
  if (type === "bird") { const name = "New bird"; admin.content.birds.push({ id: idFrom(`${name}-${Date.now()}`), name, short: "", saleType: "Enquire for current availability", dnaStatus: "DNA testing available", experience: ["some"], time: "medium", noise: "medium", home: ["house"], sprite: 0, featured: true, available: true, size: "", weight: "", temperament: "", lifespan: "", food: "", enrichment: "", image: "" }); renderBirds(); }
  if (type === "product") { admin.content.products.push({ id: idFrom(`product-${Date.now()}`), name: "New product", category: "Care", price: 0, description: "", sprite: 0, active: true, relatedBirds: [], image: "" }); renderProducts(); }
  if (type === "guide") { admin.content.guides.push({ id: idFrom(`guide-${Date.now()}`), birdId: "all", title: "New care guide", intro: "", sections: [{ title: "Overview", body: "" }] }); renderGuides(); }
  markDirty();
}

function deleteItem(type, index) {
  if (!confirm(`Delete this ${type}? This will be permanent after you save.`)) return;
  const key = type === "bird" ? "birds" : type === "product" ? "products" : "guides";
  admin.content[key].splice(index, 1); markDirty();
  if (type === "bird") renderBirds(); else if (type === "product") renderProducts(); else renderGuides();
}

async function saveContent() {
  const button = $('[data-save]'); button.disabled = true; $('[data-save-state]').textContent = "Saving…";
  try { const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(admin.content) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Save failed"); admin.content.updatedAt = result.savedAt; markSaved(); toast("Website content saved and published"); renderOverview(); }
  catch (error) { $('[data-save-state]').textContent = error.message; $('[data-save-state]').classList.add("unsaved"); toast(error.message); }
  finally { button.disabled = false; }
}

async function loadRequests() {
  try { const response = await fetch("/api/requests", { cache: "no-store" }); if (response.status === 401) return showLogin(); admin.requests = await response.json(); renderRequests(); renderOverview(); updateNewCount(); toast("Requests refreshed"); } catch { toast("Could not refresh requests"); }
}

async function updateRequestStatus(id, status) {
  try { const response = await fetch("/api/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); if (!response.ok) throw new Error(); const item = admin.requests.find(request => request.id === id); if (item) item.status = status; updateNewCount(); toast("Request status updated"); }
  catch { toast("Could not update the request"); renderRequests(); }
}

async function loadMarketplace(showMessage = true) {
  try { const { data: result, error } = await marketplaceClient.rpc('admin_marketplace_snapshot'); if (error) throw error; admin.marketplace = { sellers: result.sellers || [], products: result.products || [] }; renderSellers(); renderMarketplaceProducts(); renderOverview(); updateNewCount(); if (showMessage) toast('Marketplace refreshed'); }
  catch (error) { if (showMessage) toast(error.message); }
}

async function moderateMarketplace(entity, id, action) {
  let note = '';
  if (action === 'reject') { note = prompt(`Reason for rejecting this ${entity}:`, '') || ''; if (!note.trim()) return toast('Add a clear rejection reason'); }
  if (['suspend','hide'].includes(action) && !confirm(`${action === 'suspend' ? 'Suspend this seller and hide their products' : 'Hide this product'}?`)) return;
  try { const { error } = await marketplaceClient.rpc('admin_marketplace_action', { p_entity: entity, p_id: id, p_action: action, p_note: note }); if (error) throw error; await loadMarketplace(false); toast(`${entity === 'seller' ? 'Seller' : 'Product'} updated`); }
  catch (error) { toast(error.message); }
}

function resetAdminScroll() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
function showLogin() { $('[data-admin-app]').hidden = true; $('[data-login-shell]').hidden = false; resetAdminScroll(); }
function showAdmin() { $('[data-login-shell]').hidden = true; $('[data-admin-app]').hidden = false; resetAdminScroll(); }

async function login(event) {
  event.preventDefault(); const form = event.currentTarget; const status = $('.form-status', form); const button = $('button', form); button.disabled = true; status.textContent = "Signing in…";
  try { const credentials = Object.fromEntries(new FormData(form)); const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Sign in failed"); await marketplaceClient.auth.signInWithPassword(credentials); await bootAdmin(); }
  catch (error) { status.classList.add("error"); status.textContent = error.message; }
  finally { button.disabled = false; }
}

async function logout() { await Promise.all([fetch("/api/logout", { method: "POST" }), marketplaceClient.auth.signOut()]); location.reload(); }

async function bootAdmin() {
  const [contentResponse, requestsResponse] = await Promise.all([fetch("/api/content", { cache: "no-store" }), fetch("/api/requests", { cache: "no-store" })]);
  if (requestsResponse.status === 401) return showLogin();
  admin.content = await contentResponse.json(); admin.content.business.landline ||= "011 272 2418"; admin.requests = await requestsResponse.json(); showAdmin(); renderAll(); markSaved(); showTab("overview"); await loadMarketplace(false);
}

async function init() {
  $('[data-login-form]').addEventListener("submit", login); bindAdminEvents();
  try { const response = await fetch("/api/session", { cache: "no-store" }); if (response.ok) await bootAdmin(); else showLogin(); } catch { showLogin(); }
}

init();
