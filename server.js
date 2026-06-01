const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Configuração ──────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) console.warn('[AVISO] Defina a variável ADMIN_PASSWORD!');

// ── GitHub Gist (storage persistente, recomendado no Render) ──────────────────
// Basta criar um Gist e um token — sem bancos de dados externos.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GIST_ID      = process.env.GIST_ID      || '';
const USE_GIST     = !!(GITHUB_TOKEN && GIST_ID);
const GIST_FILE    = 'dashboard.json';

// ── Arquivo local (fallback — funciona em VPS/Railway com disco persistente) ──
const DATA_DIR  = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'dashboard.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Leitura ───────────────────────────────────────────────────────────────────
async function readData() {
  if (USE_GIST) {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept       : 'application/vnd.github+json',
        'User-Agent' : 'apex-dashboard',
      },
    });
    if (!r.ok) return null;
    const gist = await r.json();
    const file = gist.files && gist.files[GIST_FILE];
    if (!file) return null;
    // Arquivos grandes são truncados — buscar pela URL bruta
    const content = file.truncated
      ? await fetch(file.raw_url).then(x => x.text())
      : file.content;
    return JSON.parse(content);
  }
  if (!fs.existsSync(DATA_FILE)) return null;
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// ── Escrita ───────────────────────────────────────────────────────────────────
async function writeData(payload) {
  if (USE_GIST) {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method : 'PATCH',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept       : 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent'  : 'apex-dashboard',
      },
      body: JSON.stringify({
        files: { [GIST_FILE]: { content: JSON.stringify(payload) } },
      }),
    });
    if (!r.ok) {
      const msg = await r.text().catch(() => String(r.status));
      throw new Error(`GitHub Gist: ${msg}`);
    }
    return;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload));
}

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/data — público ───────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    res.json(data ?? null);
  } catch (e) {
    console.error('Erro ao ler dados:', e.message);
    res.status(500).json({ error: 'Erro ao ler dados.' });
  }
});

// ── POST /api/data — somente admin ───────────────────────────────────────────
app.post('/api/data', async (req, res) => {
  const pwd      = req.headers['x-admin-password'];
  const expected = ADMIN_PASSWORD || 'apex@2024';
  if (!pwd || pwd !== expected) return res.status(401).json({ error: 'Senha incorreta.' });
  if (!req.body || !Array.isArray(req.body.data)) return res.status(400).json({ error: 'Payload inválido.' });

  try {
    await writeData(req.body);
    const store = USE_GIST ? 'GitHub Gist' : 'arquivo local';
    console.log(`[${new Date().toISOString()}] Publicado via ${store} — ${req.body.data.length} ativos.`);
    res.json({ ok: true });
  } catch (e) {
    console.error('Erro ao salvar:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Healthcheck (UptimeRobot usa esta rota para manter o serviço ativo) ───────
app.get('/ping', (req, res) => res.send('ok'));

// ── Fallback SPA ──────────────────────────────────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Apex Dashboard → porta ${PORT} | storage: ${USE_GIST ? 'GitHub Gist' : 'arquivo local'}`);
});
