// Public site content. Anyone can read; only a signed-in developer can write.
import { sql, ensureContentTable, ensureAuthTables, tokenUser, cors, readBody } from './_db.js';

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

export default async function handler(req, res) {
  cors(res);
  noCache(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      await ensureContentTable();
      const rows = await sql`SELECT data, updated_at FROM site_content WHERE id = 1`;
      return res.status(200).json({
        ok: true,
        data: rows.length ? rows[0].data : null,
        updatedAt: rows.length ? rows[0].updated_at : null,
        source: 'database'
      });
    }

    if (req.method === 'POST') {
      await ensureAuthTables();
      const token = req.headers['x-auth-token'];
      const user = await tokenUser(token);
      if (!user) return res.status(401).json({ ok: false, error: 'Not signed in.' });
      if (user.role !== 'developer') return res.status(403).json({ ok: false, error: 'Developer access required.' });

      await ensureContentTable();
      const body = readBody(req);
      if (!body.data || typeof body.data !== 'object') {
        return res.status(400).json({ ok: false, error: 'No valid content data supplied.' });
      }

      const json = JSON.stringify(body.data);
      if (Buffer.byteLength(json, 'utf8') > 3.5 * 1024 * 1024) {
        return res.status(413).json({ ok: false, error: 'Content is larger than the 3.5 MB publish limit.' });
      }

      const rows = await sql`
        INSERT INTO site_content (id, data, updated_at)
        VALUES (1, ${json}::jsonb, now())
        ON CONFLICT (id) DO UPDATE
          SET data = EXCLUDED.data, updated_at = now()
        RETURNING updated_at
      `;
      return res.status(200).json({
        ok: true,
        savedAt: rows[0]?.updated_at || new Date().toISOString(),
        source: 'database'
      });
    }

    return res.status(405).json({ ok: false, error: 'Use GET or POST' });
  } catch (e) {
    console.error('CONTENT ERROR:', e);
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Database/content service failed.'
    });
  }
}
