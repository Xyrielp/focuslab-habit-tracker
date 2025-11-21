import './globals.css'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#667eea" />
        
        {/* iOS Safari specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FocusLab" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* iOS Safari icon */}
        <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🎯%3C/text%3E%3C/svg%3E" />
        
        {/* iOS Safari startup images */}
        <meta name="apple-mobile-web-app-orientation" content="portrait" />
        <link rel="apple-touch-startup-image" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🎯%3C/text%3E%3C/svg%3E" />
        
        {/* Prevent iOS Safari zoom on input focus */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}