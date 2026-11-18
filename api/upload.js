import { put } from "@vercel/blob";
import { isAdmin, json } from "./_auth.js";

const MAX_BYTES = 2_500_000;

function slug(value) {
  return String(value || "image").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "image";
}

async function readImage(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw new Error("Image is too large after processing");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!isAdmin(req)) return json(res, 401, { error: "Not authorised" });
  const type = req.headers["content-type"]?.split(";")[0];
  if (type !== "image/webp") return json(res, 415, { error: "Only processed WebP images are accepted" });
  const kind = req.query.kind === "bird" ? "birds" : req.query.kind === "product" ? "products" : "";
  if (!kind) return json(res, 422, { error: "Invalid image type" });
  try {
    const image = await readImage(req);
    if (!image.length) return json(res, 422, { error: "Image is empty" });
    const result = await put(`exopets/uploads/${kind}/${slug(req.query.name)}-${Date.now()}.webp`, image, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
      cacheControlMaxAge: 31536000
    });
    return json(res, 201, { ok: true, url: result.url });
  } catch (error) {
    console.error("Image upload failed", error);
    return json(res, 500, { error: error.message || "Could not upload image" });
  }
}
