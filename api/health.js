import { sql, ensureContentTable, ensureAuthTables, cors } from './_db.js';
export default async function handler(req,res){
  cors(res);
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(req.method==='OPTIONS') return res.status(200).end();
  try{
    if(!process.env.DATABASE_URL) return res.status(500).json({ok:false,databaseUrlConfigured:false,error:'DATABASE_URL is not configured in Vercel.'});
    await ensureContentTable();
    await ensureAuthTables();
    const c=await sql`SELECT id, updated_at FROM site_content WHERE id=1`;
    return res.status(200).json({ok:true,databaseUrlConfigured:true,contentTable:true,contentRecord:!!c.length,updatedAt:c[0]?.updated_at||null});
  }catch(e){return res.status(500).json({ok:false,databaseUrlConfigured:!!process.env.DATABASE_URL,error:e?.message||'Database error'});}
}
