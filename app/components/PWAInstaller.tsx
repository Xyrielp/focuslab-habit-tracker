'use client'

import { useEffect, useState } from 'react'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(() => console.log('SW registration failed'))
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowInstall(false)
    }
    
    setDeferredPrompt(null)
  }

  if (!showInstall) return null

  return (
    <div className="pwa-install-banner">
      <div className="install-content">
        <span className="install-icon">📱</span>
        <div className="install-text">
          <div className="install-title">Install FocusLab</div>
          <div className="install-subtitle">Use offline & get notifications</div>
        </div>
        <button className="install-btn" onClick={handleInstall}>
          Install
        </button>
        <button className="close-btn" onClick={() => setShowInstall(false)}>
          ×
        </button>
      </div>
    </div>
  )
}