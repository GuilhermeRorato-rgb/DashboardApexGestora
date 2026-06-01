# Apex Partners — Dashboard de Carteiras

## Por que outro dispositivo vê a tela de upload?

O Render gratuito tem **disco temporário**: o arquivo de dados some sempre que o serviço
reinicia (o que ocorre após 15 min sem acesso). O seu PC funciona porque usa o cache do
navegador (localStorage), mas outro dispositivo não tem esse cache.

**Solução:** usar um **GitHub Gist** como armazenamento permanente.
São apenas 2 variáveis extras no Render — sem bancos de dados externos.

---

## Configuração (15 minutos no total)

### Passo 1 — Criar um GitHub Personal Access Token

1. Acesse: **github.com → foto do perfil → Settings → Developer settings →
   Personal access tokens → Tokens (classic) → Generate new token (classic)**
2. Note (descrição): `apex-dashboard`
3. Expiration: **No expiration**
4. Scopes: marque apenas **`gist`**
5. Clique em **Generate token** e **copie o token** (começa com `ghp_...`)
   > ⚠️ Guarde agora — o GitHub não mostra novamente.

### Passo 2 — Criar o Gist

1. Acesse: **gist.github.com**
2. Clique em **+** (canto superior direito)
3. Filename: `dashboard.json`
4. Conteúdo: `null`
5. Clique em **Create secret gist**
6. Copie o **Gist ID** da URL (os caracteres após o último `/`)
   > Exemplo: `https://gist.github.com/seuusuario/`**`a1b2c3d4e5f6...`**

### Passo 3 — Adicionar variáveis no Render

No painel do seu serviço em [render.com](https://render.com):

1. Clique em **Environment** no menu lateral
2. Adicione (ou confirme) as variáveis:

   | Key | Value |
   |-----|-------|
   | `ADMIN_PASSWORD` | sua-senha-secreta |
   | `GITHUB_TOKEN` | ghp_... (token do Passo 1) |
   | `GIST_ID` | a1b2c3... (ID do Passo 2) |

3. Clique em **Save Changes** → Render fará o redeploy automaticamente

### Passo 4 — Publicar os dados

1. Abra o dashboard no **seu PC** (que já tem os dados em cache)
2. Clique em **Trocar planilha** e reimporte o arquivo `.xlsx`
3. Clique no botão **🚀 Publicar** que aparece no cabeçalho
4. Digite a senha (a mesma do `ADMIN_PASSWORD`)
5. Aguarde a confirmação → pronto!

Agora qualquer dispositivo verá os dados ao abrir a URL.

---

## Evitar hibernação do Render (recomendado)

O Render gratuito hiberna após 15 min de inatividade (primeiro acesso demora ~50s).
Para manter sempre ativo:

1. Cadastre-se em **uptimerobot.com** (gratuito)
2. **New Monitor → HTTP(s)**
   - URL: `https://dashboardapx.onrender.com/ping`
   - Interval: **5 minutes**
3. Salve — o serviço nunca mais hiberna

---

## Fluxo resumido

```
Admin importa planilha → clica "🚀 Publicar" → digita senha
        ↓
Dados salvos no GitHub Gist (permanente)
        ↓
Qualquer usuário abre a URL → dados carregados automaticamente
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ADMIN_PASSWORD` | ✅ Sim | Senha para publicar dados |
| `GITHUB_TOKEN` | ✅ Recomendado | Token com escopo `gist` |
| `GIST_ID` | ✅ Recomendado | ID do Gist criado no Passo 2 |
| `PORT` | Não | Render define automaticamente |
