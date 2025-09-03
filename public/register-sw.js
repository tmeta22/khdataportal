if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] ServiceWorker registration successful with scope:", registration.scope)

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available, notify user
                console.log("[PWA] New content available, please refresh")
                if (window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent("sw-update-available"))
                }
              }
            })
          }
        })
      })
      .catch((err) => {
        console.error("[PWA] ServiceWorker registration failed:", err)
        // Retry registration after 5 seconds if it fails
        setTimeout(() => {
          navigator.serviceWorker.register("/sw.js").catch((retryErr) => {
            console.error("[PWA] ServiceWorker retry registration failed:", retryErr)
          })
        }, 5000)
      })
  })
}
