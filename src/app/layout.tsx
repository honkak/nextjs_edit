'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from './contexts/UserContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>폴라리스 문서 편집기</title>
        <meta name="description" content="폴라리스 문서 편집기" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
