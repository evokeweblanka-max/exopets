import { createSessionCookie, json, readBody, validCredentials } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  try {
    const { email, password } = await readBody(req);
    if (!validCredentials(email, password)) return json(res, 401, { error: "Incorrect email or password" });
    return json(res, 200, { ok: true }, { "Set-Cookie": createSessionCookie() });
  } catch {
    return json(res, 400, { error: "Invalid request" });
  }
}
