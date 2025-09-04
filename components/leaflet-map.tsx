"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface LeafletMapProps {
  provinces: any[]
  districts: any[]
  communes: any[]
  villages: any[]
  khan: any[]
  sangkat: any[]
  boundaries: any[]
  layerStates: any
  selectedProvince?: string
  onLocationSelect?: (location: { type: string; name: string; code: string }) => void
  onZoomChange?: (zoom: number) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  currentTileLayer?: string
}

export default function LeafletMap({
  provinces,
  districts,
  communes,
  villages,
  khan,
  sangkat,
  boundaries,
  layerStates,
  selectedProvince,
  onLocationSelect,
  onZoomChange,
  isFullscreen,
  onFullscreenToggle,
  currentTileLayer = "osm",
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const boundaryLayersRef = useRef<any[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
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
        if (!window.L) {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.onload = () => {
            setL(window.L)
            setLeafletLoaded(true)
          }
          document.head.appendChild(script)
        } else {
          setL(window.L)
          setLeafletLoaded(true)
        }
      } catch (error) {
        console.error("[v0] Error loading Leaflet:", error)
      }
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !L || !mapRef.current) return

    try {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [12.5657, 104.991],
        zoom: 7,
        zoomControl: false,
        maxBounds: [
          [9.0, 102.0], // Southwest coordinates
          [15.0, 108.0], // Northeast coordinates
        ],
        maxBoundsViscosity: 1.0,
      })

      // Define tile layers
      const tileLayers = {
        osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }),
        satellite: L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          },
        ),
        hybrid: L.layerGroup([
          L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"),
          L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: "Labels &copy; Esri",
            },
          ),
        ]),
      }

      // Add default tile layer
      tileLayers.osm.addTo(map)

      map.on("zoomend", () => {
        if (onZoomChange) {
          onZoomChange(map.getZoom())
        }
      })

      mapInstanceRef.current = { map, tileLayers }

      return () => {
        if (mapInstanceRef.current?.map) {
          mapInstanceRef.current.map.remove()
        }
      }
    } catch (error) {
      console.error("[v0] Error initializing map:", error)
    }
  }, [leafletLoaded, L, onZoomChange])

  useEffect(() => {
    if (!mapInstanceRef.current?.map || !L) return

    const { map } = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []

    const addMarkers = (data: any[], color: string, type: string, enabled: boolean) => {
      if (!enabled) return

      data.forEach((item) => {
        if (item.latitude && item.longitude) {
          const marker = L.circleMarker([item.latitude, item.longitude], {
            radius: type === "provinces" ? 8 : type === "districts" || type === "khan" ? 6 : 4,
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          })

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${item.name_latin || item.name}</h3>
              <p class="text-sm text-gray-600">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p class="text-xs">Code: ${item.code}</p>
              ${item.population ? `<p class="text-xs">Population: ${item.population.toLocaleString()}</p>` : ""}
            </div>
          `)

          marker.on("click", () => {
            if (onLocationSelect) {
              onLocationSelect({
                type: type.slice(0, -1), // Remove 's' from plural
                name: item.name_latin || item.name,
                code: item.code,
              })
            }
          })

          marker.addTo(map)
          markersRef.current.push(marker)
        }
      })
    }

    // Add markers for each administrative level
    addMarkers(provinces, "#3b82f6", "provinces", layerStates.provinces)
    addMarkers(districts, "#f97316", "districts", layerStates.districts)
    addMarkers(khan, "#f97316", "khan", layerStates.khan)
    addMarkers(communes, "#22c55e", "communes", layerStates.communes)
    addMarkers(sangkat, "#22c55e", "sangkat", layerStates.sangkat)
    addMarkers(villages, "#a855f7", "villages", layerStates.villages)
  }, [provinces, districts, communes, villages, khan, sangkat, layerStates, onLocationSelect, L])

  useEffect(() => {
    if (!mapInstanceRef.current?.map || !L || !boundaries.length) return

    const { map } = mapInstanceRef.current

    // Clear existing boundary layers
    boundaryLayersRef.current.forEach((layer) => map.removeLayer(layer))
    boundaryLayersRef.current = []

    boundaries.forEach((boundary) => {
      if (boundary.geojson_data) {
        try {
          const geoJsonLayer = L.geoJSON(boundary.geojson_data, {
            style: {
              color: "#3b82f6",
              weight: 2,
              opacity: 0.8,
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
            },
            onEachFeature: (feature: any, layer: any) => {
              if (feature.properties) {
                const props = feature.properties
                layer.bindPopup(`
                  <div class="p-2">
                    <h3 class="font-semibold">${props.ADM1_EN || props.NAME_1 || "Province Boundary"}</h3>
                    <p class="text-sm text-gray-600">Administrative Boundary</p>
                    ${props.ADM1_PCODE ? `<p class="text-xs">Code: ${props.ADM1_PCODE}</p>` : ""}
                  </div>
                `)
              }
            },
          })

          if (layerStates.provinceBoundaries) {
            geoJsonLayer.addTo(map)
          }

          boundaryLayersRef.current.push(geoJsonLayer)
        } catch (error) {
          console.error("[v0] Error adding boundary layer:", error)
        }
      }
    })
  }, [boundaries, layerStates.provinceBoundaries, L])

  useEffect(() => {
    if (!mapInstanceRef.current?.map || !mapInstanceRef.current?.tileLayers) return

    const { map, tileLayers } = mapInstanceRef.current

    // Remove current tile layer
    Object.values(tileLayers).forEach((layer: any) => {
      map.removeLayer(layer)
    })

    // Add new tile layer
    if (tileLayers[currentTileLayer]) {
      tileLayers[currentTileLayer].addTo(map)
    }
  }, [currentTileLayer])

  const handleZoom = (direction: "in" | "out") => {
    if (!mapInstanceRef.current?.map) return
    const { map } = mapInstanceRef.current

    if (direction === "in") {
      map.zoomIn()
    } else {
      map.zoomOut()
    }
  }

  if (!leafletLoaded) {
    return (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 bg-white rounded-lg shadow-lg p-1">
        <Button variant="ghost" size="sm" onClick={() => handleZoom("in")}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleZoom("out")}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onFullscreenToggle}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
