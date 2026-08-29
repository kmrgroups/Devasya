// Lightweight production diagnostics for the website/content connection.
import { sql, ensureContentTable, ensureAuthTables, cors } from './_db.js';

export default async function handler(req, res) {
  cors(res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok:false, error:'Use GET' });

  const out = { ok:false, databaseUrlConfigured:!!process.env.DATABASE_URL, contentTable:false, contentRecord:false };
  try {
    await ensureContentTable();
    out.contentTable = true;
    const rows = await sql`SELECT updated_at FROM site_content WHERE id = 1`;
    out.contentRecord = rows.length > 0;
    out.updatedAt = rows.length ? rows[0].updated_at : null;
    // Verify auth schema separately without exposing any credentials.
    await ensureAuthTables();
    out.authTable = true;
    out.ok = true;
    return res.status(200).json(out);
  } catch (e) {
    out.error = e?.message || 'Database check failed.';
    return res.status(500).json(out);
  }
}
