import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClearingOps — Operaciones de Clearing',
  description: 'Plataforma de validación y conciliación de clearing para medios de pago',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
