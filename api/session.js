import { isAdmin, json } from "./_auth.js";

export default function handler(req, res) {
  const authenticated = isAdmin(req);
  return json(res, authenticated ? 200 : 401, { authenticated, email: authenticated ? process.env.ADMIN_EMAIL : null });
}
