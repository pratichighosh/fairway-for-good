import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fairway for Good — Golf. Win. Give.',
  description: 'Subscription golf platform with monthly prize draws and charity giving.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}