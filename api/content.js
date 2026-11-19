import { defaultContent } from "./_defaults.js";
import { isAdmin, json, readBody } from "./_auth.js";
import { readJson, writeJson } from "./_store.js";

const PATH = "exopets/content.json";

function hydrateContent(saved = {}) {
  return {
    ...defaultContent,
    ...saved,
    business: { ...defaultContent.business, ...(saved.business || {}) },
    birds: Array.isArray(saved.birds) ? saved.birds : defaultContent.birds,
    products: Array.isArray(saved.products) ? saved.products : defaultContent.products,
    guides: Array.isArray(saved.guides) ? saved.guides : defaultContent.guides,
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
    // Owner edits must be visible immediately. Caching this JSON at the edge meant
    // a newly saved product could keep its previous image for several minutes.
    res.setHeader("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    return json(res, 200, content);
  }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!isAdmin(req)) return json(res, 401, { error: "Not authorised" });
  try {
    const content = await readBody(req);
    if (!content?.business?.name || !Array.isArray(content.birds) || !Array.isArray(content.products) || !Array.isArray(content.guides) || content.birds.length > 100 || content.products.length > 500 || content.guides.length > 100) {
      return json(res, 422, { error: "Content is incomplete" });
    }
    const savedAt = new Date().toISOString();
    await writeJson(PATH, { ...content, updatedAt: savedAt });
    res.setHeader("Cache-Control", "no-store");
    return json(res, 200, { ok: true, savedAt });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Could not save content" });
  }
}
