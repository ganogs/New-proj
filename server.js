const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = __dirname, DATA = path.join(ROOT, 'data'), DB = path.join(DATA, 'store.json');
const PORT = process.env.PORT || 3000;
const DEFAULT_FEEDS = [
  {name:'BBC Tamil', url:'https://feeds.bbci.co.uk/tamil/rss.xml'},
  {name:'The Hindu - Tamil Nadu', url:'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss'},
  {name:'Google News - Tamil Nadu', url:'https://news.google.com/rss/search?q=Tamil+Nadu&hl=ta&gl=IN&ceid=IN:ta'}
];
let store = {feeds:DEFAULT_FEEDS, news:[], settings:{autoPublish:true, pollMinutes:5}, lastPoll:null, logs:[]};
async function load(){ try { store={...store,...JSON.parse(await fs.readFile(DB,'utf8'))}; } catch{} }
async function save(){ await fs.mkdir(DATA,{recursive:true}); await fs.writeFile(DB,JSON.stringify(store,null,2)); }
function esc(s=''){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function tag(xml,name){const re=new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i');const m=xml.match(re);return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\\d+);/g,(_,n)=>String.fromCodePoint(+n)).trim():'';}
function category(t){const s=t.toLowerCase(); if(/தமிழ்நாடு|சென்னை|மதுரை|கோவை|தமிழக|கனமழை/.test(s))return 'தமிழ்நாடு'; if(/இந்தியா|மத்திய அரசு|பிரதமர்|நாடாளுமன்றம்/.test(s))return 'இந்தியா'; if(/விளையாட்டு|கிரிக்கெட்|ஐபிஎல்|கால்பந்து/.test(s))return 'விளையாட்டு'; if(/சினிமா|திரைப்படம்|நடிகர்|நடிகை/.test(s))return 'சினிமா'; if(/பங்கு|வங்கி|விலை|பொருளாதாரம்|வணிகம்/.test(s))return 'வணிகம்'; return 'உலகம்';}
async function aiRewrite(title, description){
 const key=process.env.GEMINI_API_KEY; if(!key)return null;
 try{
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+encodeURIComponent(key),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'நீங்கள் தமிழ் செய்தி ஆசிரியர். கீழே உள்ள மூலத் தகவலை மட்டுமே பயன்படுத்தி 2-3 வாக்கியங்களில் 60-90 சொற்களுக்குள் சுருக்கமான, தெளிவான செய்தியை தமிழில் எழுதுங்கள். புதிய தகவல் கற்பிக்க வேண்டாம். தலைப்பையும் சுருக்கத்தையும் JSON வடிவில் மட்டும் கொடுக்கவும்: {"title":"...","summary":"..."}\\nதலைப்பு: '+title+'\\nமூல விவரம்: '+description}]}],generationConfig:{temperature:0.2,responseMimeType:'application/json'}})});
  if(!r.ok)throw new Error('Gemini '+r.status); const j=await r.json(); const raw=j.candidates?.[0]?.content?.parts?.[0]?.text||'{}'; return JSON.parse(raw);
 }catch(e){store.logs.unshift(new Date().toISOString()+' AI fallback: '+e.message);return null;}
}
async function poll(){
 let added=0, errors=0;
 for(const feed of store.feeds){
  try{
   const res=await fetch(feed.url,{headers:{'user-agent':'MakkalShortNews/1.0 RSS reader'},signal:AbortSignal.timeout(18000)});
   if(!res.ok)throw new Error('HTTP '+res.status);
   const xml=await res.text(); const entries=[]; const itemRe=new RegExp('<(item|entry)\\b[\\s\\S]*?</\\1>','gi'); let itemMatch; while((itemMatch=itemRe.exec(xml))&&entries.length<20) entries.push(itemMatch[0]);
   for(const item of entries){
    let title=tag(item,'title'); let link=tag(item,'link');
    if(!link){const lm=item.match(/<link[^>]+href=["']([^"']+)/i);link=lm?lm[1]:'';}
    const description=tag(item,'description')||tag(item,'summary')||tag(item,'content:encoded');
    if(!title||!link||store.news.some(n=>n.link===link)||store.news.some(n=>n.originalTitle.toLowerCase()===title.toLowerCase()))continue;
    const ai=await aiRewrite(title,description);
    const clean=(ai?.summary||description||title).split(/\s+/).join(' ').slice(0,600);
    store.news.unshift({id:crypto.randomUUID(),title:ai?.title||title,originalTitle:title,summary:clean,link,source:feed.name,category:category(title+' '+description),status:store.settings.autoPublish?'published':'draft',createdAt:new Date().toISOString(),publishedAt:store.settings.autoPublish?new Date().toISOString():null});
    added++;
   }
  }catch(e){errors++;store.logs.unshift(new Date().toISOString()+' '+feed.name+': '+e.message);}
 }
 store.news=store.news.slice(0,500);store.lastPoll=new Date().toISOString();
 store.logs.unshift(new Date().toISOString()+' RSS poll: '+added+' added, '+errors+' feed errors');store.logs=store.logs.slice(0,100);
 await save(); return {added,errors,total:store.news.length};
}
function send(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'});res.end(JSON.stringify(obj));}
function auth(req){return req.headers['x-admin-password'] && req.headers['x-admin-password']===(process.env.ADMIN_PASSWORD||'change-this-password');}
async function body(req){let s='';for await(const c of req)s+=c;return s?JSON.parse(s):{};}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'); const p=url.pathname;
 if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'content-type,x-admin-password'});return res.end();}
 try{
  if(p==='/api/health')return send(res,200,{ok:true,name:'Makkal Short News',lastPoll:store.lastPoll});
  if(p==='/api/news'&&req.method==='GET'){const list=store.news.filter(n=>n.status==='published');return send(res,200,{news:list,updatedAt:store.lastPoll});}
  if(p.startsWith('/api/admin/')){
   if(!auth(req))return send(res,401,{error:'Admin password required'});
   if(p==='/api/admin/overview')return send(res,200,{news:store.news,feeds:store.feeds,settings:store.settings,lastPoll:store.lastPoll,logs:store.logs,aiEnabled:!!process.env.GEMINI_API_KEY});
   if(p==='/api/admin/poll'&&req.method==='POST')return send(res,200,await poll());
   if(p==='/api/admin/feeds'&&req.method==='PUT'){const b=await body(req);store.feeds=(b.feeds||[]).filter(f=>{if(!f.name||!f.url)return false;try{return ['http:','https:'].includes(new URL(f.url).protocol);}catch{return false;}});await save();return send(res,200,{feeds:store.feeds});}
   if(p==='/api/admin/settings'&&req.method==='PUT'){const b=await body(req);store.settings={...store.settings,autoPublish:!!b.autoPublish,pollMinutes:Math.max(2,Math.min(60,Number(b.pollMinutes)||5))};await save();return send(res,200,store.settings);}
   const newsId=p.startsWith('/api/admin/news/')?decodeURIComponent(p.slice('/api/admin/news/'.length)):null;
   if(newsId){const n=store.news.find(x=>x.id===newsId);if(!n)return send(res,404,{error:'Not found'});if(req.method==='PUT'){Object.assign(n,await body(req));await save();return send(res,200,n);}if(req.method==='DELETE'){store.news=store.news.filter(x=>x.id!==n.id);await save();return send(res,200,{ok:true});}}
   return send(res,404,{error:'Unknown admin endpoint'});
  }
  if(p==='/'||p==='/admin'||p.startsWith('/assets/')){
   const file=p==='/admin'?path.join(ROOT,'public','admin.html'):p==='/'?path.join(ROOT,'public','index.html'):path.join(ROOT,'public',p.slice(1));
   const data=await fs.readFile(file);const ext=path.extname(file);res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[ext]||'application/octet-stream')});return res.end(data);
  }
  send(res,404,{error:'Not found'});
 }catch(e){send(res,500,{error:e.message});}
});
(async()=>{await load();server.listen(PORT,()=>console.log('Makkal Short News listening on '+PORT));setTimeout(()=>poll().catch(console.error),5000);setInterval(()=>poll().catch(console.error),Math.max(2,Number(store.settings.pollMinutes)||5)*60000);})();
