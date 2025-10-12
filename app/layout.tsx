import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shipping Protection App',
  description: 'Custom cart with shipping protection for Shopify stores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

