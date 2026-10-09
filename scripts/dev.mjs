import http from 'node:http';
import { readFile } from 'node:fs/promises';
import * as api from '../api/index.js';
const publicRoot = new URL('../public/',import.meta.url);
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const method = api[req.method];
      const response = method ? await method(new Request(url,{method:req.method})) : new Response('Method not allowed',{status:405});
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const path = ['/', '/docs', '/docs/'].includes(url.pathname) ? 'index.html' : url.pathname === '/guide' ? 'guide.html' : url.pathname === '/playground' ? 'playground.html' : /^\/read\/\d{4}\/\d{1,3}\/?$/.test(url.pathname) ? 'read.html' : url.pathname.slice(1);
    if (!['index.html','read.html','read.js','result-view.js','playground.html','playground.js','app.js','style.css','openapi.json','coverage.json','guide.html','assets/leaders-collage-v2.webp','assets/leaders-hero.webp'].includes(path)) { res.writeHead(404);res.end('Not found');return; }
    const bytes = await readFile(new URL(path,publicRoot));
    const types = {html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',webp:'image/webp'};
    res.writeHead(200,{'Content-Type':types[path.split('.').pop()]+'; charset=utf-8'});res.end(bytes);
  } catch { res.writeHead(500);res.end('Internal server error'); }
});
server.listen(Number(process.env.PORT || 3000),'0.0.0.0',() => console.log(`Tamilnadu API: http://localhost:${server.address().port}`));
