import { clearSessionCookie, json } from "./_auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  return json(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
}
