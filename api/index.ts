export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, path: req.url }));
}
