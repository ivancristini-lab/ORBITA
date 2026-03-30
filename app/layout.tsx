import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ÓRBITA — Relationship Intelligence",
  description: "El CRM inteligente para founders. Te dice con quién hablar, cuándo y por qué.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
