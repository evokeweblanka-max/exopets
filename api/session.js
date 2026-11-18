import { isAdmin, json } from "./_auth.js";

export default function handler(req, res) {
  return json(res, isAdmin(req) ? 200 : 401, { authenticated: isAdmin(req), email: isAdmin(req) ? process.env.ADMIN_EMAIL : null });
}
