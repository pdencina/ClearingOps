import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

export const metadata: Metadata = {
  title: 'KLAP CORE — Payment Operating System',
  description: 'Plataforma de procesamiento y liquidación de pagos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 overflow-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
