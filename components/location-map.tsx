"use client"

import { useEffect, useRef } from "react"

interface Province {
  id: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface LocationMapProps {
  province: Province
}

export default function LocationMap({ province }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !province) return

    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }

        // Load Leaflet JS
        const L = await import("leaflet")
        const leaflet = L.default || L

        // Clean up existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Wait for next tick to ensure DOM is fully rendered
        setTimeout(() => {
          if (!mapRef.current) return

          try {
            console.log("[v0] Initializing map for province:", province.name_latin)

            delete (leaflet.Icon.Default.prototype as any)._getIconUrl
            leaflet.Icon.Default.mergeOptions({
              iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
              iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            })

            // Create map instance with proper center and zoom
            const map = leaflet.map(mapRef.current, {
              center: [province.latitude, province.longitude],
              zoom: 9,
              zoomControl: true,
              scrollWheelZoom: true,
              doubleClickZoom: true,
              dragging: true,
            })
            mapInstanceRef.current = map

            // Add tile layer
            leaflet
              .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
                maxZoom: 18,
              })
              .addTo(map)

            const selectedIcon = leaflet.divIcon({
              className: "custom-marker-selected",
              html: `<div style="
                background-color: #3b82f6;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
              "></div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            })

            // Add marker for selected province
            const marker = leaflet
              .marker([province.latitude, province.longitude], { icon: selectedIcon })
              .addTo(map)
              .bindPopup(`
                <div style="text-align: center; padding: 4px;">
                  <strong>${province.name_latin}</strong><br/>
                  <span style="font-family: 'Khmer OS', sans-serif;">${province.name_khmer}</span><br/>
                  <small>Lat: ${province.latitude}, Lng: ${province.longitude}</small>
                </div>
              `)
              .openPopup()

            markerRef.current = marker

            const bounds = leaflet.latLngBounds([[province.latitude, province.longitude]])
            map.fitBounds(bounds, { padding: [20, 20] })

            console.log("[v0] Map initialized successfully")
          } catch (error) {
            console.error("[v0] Error initializing map:", error)
          }
        }, 100)
      } catch (error) {
        console.error("[v0] Error loading Leaflet:", error)
      }
    }

    loadLeaflet()

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [province])

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} className="rounded-lg overflow-hidden border" />
}
