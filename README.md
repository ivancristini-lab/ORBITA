# 🛸 ÓRBITA v3 — Relationship Intelligence

> **El CRM inteligente para founders.** Fondo Matrix animado, glassmorphism extremo, cursor custom, dark/light mode. Listo para Supabase.

## 🚀 Setup rápido (3 pasos)

```bash
# 1. Instalar
npm install

# 2. Configurar IA
cp .env.local.example .env.local
# → Editá con tu GEMINI_API_KEY (gratis en aistudio.google.com)

# 3. Correr
npm run dev
```

Abrí [http://localhost:3000/auth](http://localhost:3000/auth) → registrate o usá "Explorar con demo".

---

## 🔑 Variables de entorno

| Variable | Descripción | Gratis |
|----------|-------------|--------|
| `GEMINI_API_KEY` | Google Gemini (recomendado) | ✅ |
| `ANTHROPIC_API_KEY` | Claude fallback | — |
| `OPENAI_API_KEY` | GPT fallback | — |

> Sin API key: funciona con insights determinísticos inteligentes. Perfecto para demo.

---

## 🎨 Features visuales

- **🌌 Fondo Matrix/Neural** — Canvas animado con lluvia de caracteres japoneses/hex + red neuronal de partículas
- **🖱️ Cursor custom** — Cursor de punto cyan con ring que sigue con easing, glow effect
- **🌙☀️ Dark/Light mode** — Toggle en topbar y auth, persiste en localStorage
- **✨ Glassmorphism** — Paneles con backdrop-filter y border de luz
- **📊 Stats animados** — Cards con hover transform y glow
- **🎯 Score con neon glow** — text-shadow neon en scores críticos
- **⚡ Animaciones de entrada** — fadeUp escalonado en contact rows
- **🔴 Alertas pulsantes** — Dot animado en relaciones en riesgo
- **🏆 Milestones timeline** — Registro de hitos por contacto

---

## 📁 Estructura

```
app/
  auth/           → Registro + Login (animado)
  page.tsx        → Dashboard (Matrix bg, 3 paneles)
  contacts/
    new/          → Crear contacto (+ auto-insight)
    [id]/         → Detalle (tabs: Insight/Notas/Mensaje/Hitos)
  api/
    auth/         → Register, Login (listo Supabase)
    contacts/     → CRUD completo
    notes/        → Notas por contacto
    insights/     → Generación con IA
    milestones/   → Hitos por contacto ← NUEVO
    actions/      → Mensajes personalizados
    health/       → Status del sistema
    user/         → Perfil del usuario

components/
  MatrixBackground.tsx  → Canvas animado Matrix + Neural
  CustomCursor.tsx      → Cursor custom con glow

lib/
  ai.ts           → Gemini → Anthropic → OpenAI → fallback
  store.ts        → JSON file, listo para reemplazar con Supabase
  types.ts        → User, Contact, Note, Milestone, Insight
  demo.ts         → 5 contactos demo con insights reales
  scoring.ts      → Algoritmo de scores y señales
  validators.ts   → Zod schemas
```

---

## 🗄️ Conectar Supabase

El store actual persiste en `.orbita-data/store.json` (perfecto para Vercel con volumen, o demo).

**Para conectar Supabase:**

1. Creá proyecto en [supabase.com](https://supabase.com)
2. Ejecutá este SQL en el editor de Supabase:

```sql
-- Users
create table users (
  id text primary key,
  name text not null,
  email text unique not null,
  goal text default '',
  theme text default 'dark',
  created_at timestamptz default now()
);

-- Contacts  
create table contacts (
  id text primary key,
  user_id text references users(id) on delete cascade,
  name text not null,
  role text not null,
  company text default '',
  tags text[] default '{}',
  days_since_contact int default 0,
  linkedin text,
  phone text,
  created_at timestamptz default now()
);

-- Notes
create table notes (
  id text primary key,
  contact_id text references contacts(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Milestones
create table milestones (
  id text primary key,
  contact_id text references contacts(id) on delete cascade,
  title text not null,
  description text default '',
  date timestamptz not null,
  type text default 'other',
  created_at timestamptz default now()
);

-- Insights
create table insights (
  id text primary key,
  contact_id text references contacts(id) on delete cascade,
  type text not null,
  message text not null,
  suggested_action text not null,
  score int not null,
  created_at timestamptz default now()
);
```

3. Reemplazá `lib/store.ts` con queries de Supabase
4. Agregá env vars y activá auth de Supabase

---

## 🚀 Deploy en Vercel

```bash
# Push a GitHub → importar en vercel.com
# Agregá environment variables en Settings → Environment Variables:
# GEMINI_API_KEY = tu_key
```

---

## ⚠️ Logo

El `public/logo.png` es un placeholder generado. Para usar el logo real:
1. Descargá tu logo de `https://i.imgur.com/Nclvc4C.png`
2. Reemplazá `public/logo.png`

---

**Construido para hackathon → producción** 🏆
