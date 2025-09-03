import type React from "react"
import type { Metadata, Viewport } from "next"
import { Kantumruy_Pro } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { Suspense } from "react"
import "./globals.css"

const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  display: "swap",
  variable: "--font-kantumruy-pro",
})

export const metadata: Metadata = {
  title: "Cambodia Administrative Data Portal",
  description:
    "Navigate and explore Cambodia's administrative hierarchy through interactive maps, cascading selections, and comprehensive search capabilities.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cambodia Admin Portal",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Cambodia Administrative Data Portal",
    title: "Cambodia Administrative Data Portal",
    description:
      "Navigate and explore Cambodia's administrative hierarchy through interactive maps, cascading selections, and comprehensive search capabilities.",
  },
  twitter: {
    card: "summary",
    title: "Cambodia Administrative Data Portal",
    description:
      "Navigate and explore Cambodia's administrative hierarchy through interactive maps, cascading selections, and comprehensive search capabilities.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e40af" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cambodia Admin Portal" />
        <meta name="application-name" content="Cambodia Admin Portal" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`font-sans ${kantumruyPro.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Suspense fallback={null}>
              {children}
              <PWAUpdatePrompt />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>

        <Script src="/register-sw.js" strategy="afterInteractive" />
        <Analytics />
      </body>
    </html>
  )
}
