// MINIMAL DEBUG HANDLER — isolating FUNCTION_INVOCATION_FAILED
// Restore from api/index.ts.full once we confirm the function deploys.
export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, path: req.url, node: process.version }));
}
