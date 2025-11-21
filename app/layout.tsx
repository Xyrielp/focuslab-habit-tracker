import './globals.css'

export const metadata = {
  title: 'FocusLab - Habit Tracker',
  description: 'Track your daily habits with calendar view',
  viewport: 'width=device-width, initial-scale=1',
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