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
        <title>필살 에디터 : 웹소설 작가를 위한</title>
        <meta name="description" content="웹소설 작가를 위한 문서 편집기" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
