import { defaultContent } from "./_defaults.js";
import { isAdmin, json, readBody } from "./_auth.js";
import { readJson, writeJson } from "./_store.js";

const PATH = "exopets/content.json";

function mergeMissingById(saved = [], defaults = []) {
  const items = Array.isArray(saved) ? saved : [];
  const ids = new Set(items.map(item => item?.id));
  return [...items, ...defaults.filter(item => !ids.has(item.id))];
}

function hydrateContent(saved = {}) {
  return {
    ...defaultContent,
    ...saved,
    business: { ...defaultContent.business, ...(saved.business || {}) },
    birds: mergeMissingById(saved.birds, defaultContent.birds),
    products: mergeMissingById(saved.products, defaultContent.products),
    guides: mergeMissingById(saved.guides, defaultContent.guides),
    matcher: {
      ...defaultContent.matcher,
      ...(saved.matcher || {}),
      questions: saved.matcher?.questions?.length ? saved.matcher.questions : defaultContent.matcher.questions
    }
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const content = hydrateContent(await readJson(PATH, defaultContent));
    const grey = content.birds?.find(item => item.id === "african-grey");
    if (grey) {
      if (grey.size === "33 cm") grey.size = "≈ 33 cm";
      if (grey.weight === "400–600 g") grey.weight = "≈ 400 g";
      if (grey.food === "Quality pellets, fresh fruits and vegetables") grey.food = "Complete pellets, vegetables and limited fruit";
      if (grey.enrichment === "Foraging, training and rotating toys") grey.enrichment = "Daily foraging, training and rotating safe toys";
    }
    const supplement = content.products?.find(item => item.id === "feather-support");
    if (supplement?.name === "Feather Support Supplement") supplement.name = "Avian Mineral Support";
    if (supplement?.description === "Daily nutritional support for healthy plumage.") supplement.description = "Use only when advised for your bird’s individual diet.";
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
    return json(res, 200, content);
  }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!isAdmin(req)) return json(res, 401, { error: "Not authorised" });
  try {
    const content = await readBody(req);
    if (!content?.business?.name || !Array.isArray(content.birds) || !Array.isArray(content.products) || !Array.isArray(content.guides)) {
      return json(res, 422, { error: "Content is incomplete" });
    }
    await writeJson(PATH, { ...content, updatedAt: new Date().toISOString() });
    return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Could not save content" });
  }
}
