import { list, put } from "@vercel/blob";

export async function readJson(pathname, fallback) {
  try {
    const result = await list({ prefix: pathname, limit: 20 });
    const blob = result.blobs.find(item => item.pathname === pathname);
    if (!blob) return fallback;
    const response = await fetch(`${blob.url}?v=${blob.uploadedAt?.getTime?.() || Date.now()}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return await response.json();
  } catch (error) {
    console.error("Blob read failed", error);
    return fallback;
  }
}

export async function writeJson(pathname, value) {
  return put(pathname, JSON.stringify(value), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 60
  });
}
