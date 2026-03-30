# Órbita v4 — Relationship Intelligence

> Sabés con quién hablar. La IA te dice cuándo.

## Setup

```bash
npm install
cp .env.local.example .env.local  # → agrega GEMINI_API_KEY
npm run dev
```

Abrí http://localhost:3000/auth

## Variables de entorno

```
GEMINI_API_KEY=    # Google Gemini (gratis en aistudio.google.com)
ANTHROPIC_API_KEY= # Alternativa
OPENAI_API_KEY=    # Alternativa
```

## Deploy en Vercel

Push a GitHub → importar en vercel.com → agregar GEMINI_API_KEY en Environment Variables.

## Logo

Reemplazá public/logo.png con tu imagen real.

## Supabase (producción)

Ver README completo en v3 para schema SQL. Reemplazar lib/store.ts con queries de Supabase.
