import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodeDNA — Code Fingerprint Analyzer',
  description: 'Convert any code into a unique DNA fingerprint. Detect similarity, track code evolution, visualize structure.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
