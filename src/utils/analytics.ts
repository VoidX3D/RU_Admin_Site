declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_IDS = ['G-HWFPCZ4W1Q', 'G-HJTLGVDNYK']

let initialized = false

export function initAdminAnalytics() {
  if (initialized) return
  initialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_IDS[0]}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  GA_MEASUREMENT_IDS.forEach((id) => {
    window.gtag('config', id, {
      send_page_view: false,
      linker: { domains: ['ruclubmss.vercel.app'] },
    })
  })
}

export function trackAdminPage(path: string, title: string) {
  if (typeof window.gtag === 'undefined') return
  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: window.location.href,
    page_path: path,
  })
}
