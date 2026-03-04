import type { Metadata } from 'next'
import {
  Bricolage_Grotesque,
  Fraunces,
  IBM_Plex_Mono,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Newsreader,
  Space_Grotesk,
} from 'next/font/google'
import { resolveDashboardVariant } from '@/lib/dashboardVariant'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  weight: ['400'],
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Co-Working Control Center',
  description: 'A local-first command center to run your work with AI support.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const variant = resolveDashboardVariant(process.env.NEXT_PUBLIC_DASHBOARD_VARIANT)
  const bodyVariant = variant === 'middle' ? undefined : variant

  return (
    <html lang="en">
      <body
        data-variant={bodyVariant}
        className={`${spaceGrotesk.variable} ${bricolage.variable} ${inter.variable} ${newsreader.variable} ${fraunces.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
