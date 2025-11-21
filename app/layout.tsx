import './globals.css'

export const metadata = {
  title: 'FocusLab - Habit Tracker',
  description: 'Track your daily habits with calendar view',
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