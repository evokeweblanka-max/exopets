import { randomUUID } from "node:crypto";
import { isAdmin, json, readBody } from "./_auth.js";
import { readJson, writeJson } from "./_store.js";

const PATH = "exopets/requests.json";

function clean(value, max = 500) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!isAdmin(req)) return json(res, 401, { error: "Not authorised" });
    return json(res, 200, await readJson(PATH, []));
  }
  if (req.method === "PATCH") {
    if (!isAdmin(req)) return json(res, 401, { error: "Not authorised" });
    try {
      const body = await readBody(req);
      if (!body.id || !["new", "contacted", "closed"].includes(body.status)) return json(res, 422, { error: "Invalid request status" });
      const current = await readJson(PATH, []);
      const item = current.find(request => request.id === body.id);
      if (!item) return json(res, 404, { error: "Request not found" });
      item.status = body.status;
      item.updatedAt = new Date().toISOString();
      await writeJson(PATH, current);
      return json(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      return json(res, 500, { error: "Could not update request" });
    }
  }
  if (req.method === "DELETE") {
    if (!isAdmin(req)) return json(res, 401, { error: "Not authorised" });
    try {
      const body = await readBody(req);
      if (!body.id) return json(res, 422, { error: "Request ID is required" });
      const current = await readJson(PATH, []);
      const next = current.filter(request => request.id !== body.id);
      if (next.length === current.length) return json(res, 404, { error: "Request not found" });
      await writeJson(PATH, next);
      return json(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      return json(res, 500, { error: "Could not delete request" });
    }
  }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  try {
    const body = await readBody(req);
    if (body.website) return json(res, 200, { ok: true });
    const name = clean(body.name, 100);
    const phone = clean(body.phone, 40);
    const type = ["enquiry", "dna", "order", "matcher"].includes(body.type) ? body.type : "enquiry";
    if (!name || !phone) return json(res, 422, { error: "Name and contact number are required" });
    const item = {
      id: randomUUID(),
      type,
      name,
      phone,
      email: clean(body.email, 160),
      bird: clean(body.bird, 120),
      quantity: Math.max(1, Math.min(20, Number(body.quantity) || 1)),
      preference: clean(body.preference, 80),
      message: clean(body.message, 1000),
      cart: Array.isArray(body.cart) ? body.cart.slice(0, 30).map(x => ({ id: clean(x.id, 100), name: clean(x.name, 150), quantity: Math.max(1, Math.min(20, Number(x.quantity) || 1)), price: Number(x.price) || 0 })) : [],
      answers: body.answers && typeof body.answers === "object" ? body.answers : {},
      status: "new",
      createdAt: new Date().toISOString()
    };
    const current = await readJson(PATH, []);
    await writeJson(PATH, [item, ...current].slice(0, 2000));
    return json(res, 201, { ok: true, reference: item.id.slice(0, 8).toUpperCase() });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Could not submit your request" });
  }
}
