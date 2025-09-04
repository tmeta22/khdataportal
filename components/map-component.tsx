"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MapComponentProps {
  selectedProvince?: string
  selectedDistrict?: string
  selectedCommune?: string
  selectedVillage?: string
  onLocationSelect?: (location: { type: string; name: string; code: string; id?: string }) => void
  onZoomChange?: (zoom: number) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  showProvinceMarkers?: boolean
  showDistrictMarkers?: boolean
  showCommuneMarkers?: boolean
  showVillageMarkers?: boolean
  showProvinceBoundaries?: boolean
  showDistrictBoundaries?: boolean
  showCommuneBoundaries?: boolean
  mapType?: "osm" | "google" | "satellite" | "hybrid"
}

const fallbackProvinces = [
  {
    id: "1",
    code: "01",
    name_latin: "Banteay Meanchey",
    name_khmer: "បន្ទាយមានជ័យ",
    latitude: 13.7467,
    longitude: 102.97,
  },
  {
    id: "2",
    code: "02",
    name_latin: "Battambang",
    name_khmer: "បាត់ដំបង",
    latitude: 13.0957,
    longitude: 103.2027,
  },
  {
    id: "3",
    code: "03",
    name_latin: "Kampong Cham",
    name_khmer: "កំពង់ចាម",
    latitude: 11.9934,
    longitude: 105.4635,
  },
  {
    id: "4",
    code: "04",
    name_latin: "Kampong Chhnang",
    name_khmer: "កំពង់ឆ្នាំង",
    latitude: 12.2494,
    longitude: 104.6675,
  },
  {
    id: "5",
    code: "05",
    name_latin: "Kampong Speu",
    name_khmer: "កំពង់ស្ពឺ",
    latitude: 11.4564,
    longitude: 104.5225,
  },
  {
    id: "6",
    code: "06",
    name_latin: "Kampong Thom",
    name_khmer: "កំពង់ធំ",
    latitude: 12.7112,
    longitude: 104.8886,
  },
  { id: "7", code: "07", name_latin: "Kampot", name_khmer: "កំពត", latitude: 10.6104, longitude: 104.1781 },
  { id: "8", code: "08", name_latin: "Kandal", name_khmer: "កណ្ដាល", latitude: 11.2436, longitude: 105.1262 },
  {
    id: "9",
    code: "09",
    name_latin: "Koh Kong",
    name_khmer: "កោះកុង",
    latitude: 11.6151,
    longitude: 102.9835,
  },
  { id: "10", code: "10", name_latin: "Kratié", name_khmer: "ក្រចេះ", latitude: 12.4878, longitude: 106.0197 },
  {
    id: "11",
    code: "11",
    name_latin: "Mondulkiri",
    name_khmer: "មណ្ឌលគិរី",
    latitude: 12.4545,
    longitude: 107.2067,
  },
  {
    id: "12",
    code: "12",
    name_latin: "Phnom Penh",
    name_khmer: "ភ្នំពេញ",
    latitude: 11.5564,
    longitude: 104.9282,
  },
  {
    id: "13",
    code: "13",
    name_latin: "Preah Vihear",
    name_khmer: "ព្រះវិហារ",
    latitude: 13.8059,
    longitude: 104.9717,
  },
  {
    id: "14",
    code: "14",
    name_latin: "Prey Veng",
    name_khmer: "ព្រៃវែង",
    latitude: 11.4866,
    longitude: 105.3257,
  },
  {
    id: "15",
    code: "15",
    name_latin: "Pursat",
    name_khmer: "ពោធិ៍សាត់",
    latitude: 12.5388,
    longitude: 103.9192,
  },
  {
    id: "16",
    code: "16",
    name_latin: "Ratanakiri",
    name_khmer: "រតនគិរី",
    latitude: 13.7368,
    longitude: 106.9873,
  },
  {
    id: "17",
    code: "17",
    name_latin: "Siem Reap",
    name_khmer: "សៀមរាប",
    latitude: 13.3671,
    longitude: 103.8448,
  },
  {
    id: "18",
    code: "18",
    name_latin: "Preah Sihanouk",
    name_khmer: "ព្រះសីហនុ",
    latitude: 10.6104,
    longitude: 103.5291,
  },
  {
    id: "19",
    code: "19",
    name_latin: "Stung Treng",
    name_khmer: "ស្ទឹងត្រែង",
    latitude: 13.5259,
    longitude: 105.9683,
  },
  {
    id: "20",
    code: "20",
    name_latin: "Svay Rieng",
    name_khmer: "ស្វាយរៀង",
    latitude: 11.0877,
    longitude: 105.7993,
  },
  { id: "21", code: "21", name_latin: "Takéo", name_khmer: "តាកែវ", latitude: 10.9909, longitude: 104.7851 },
  {
    id: "22",
    code: "22",
    name_latin: "Oddar Meanchey",
    name_khmer: "ឧត្តរមានជ័យ",
    latitude: 14.1667,
    longitude: 103.5167,
  },
  { id: "23", code: "23", name_latin: "Kep", name_khmer: "កែប", latitude: 10.4833, longitude: 104.3167 },
  { id: "24", code: "24", name_latin: "Pailin", name_khmer: "ប៉ៃលិន", latitude: 12.85, longitude: 102.6167 },
  {
    id: "25",
    code: "25",
    name_latin: "Tboung Khmum",
    name_khmer: "ត្បូងឃ្មុំ",
    latitude: 12.2,
    longitude: 105.9667,
  },
]

export default function MapComponent({
  selectedProvince,
  selectedDistrict,
  selectedCommune,
  selectedVillage,
  onLocationSelect,
  onZoomChange,
  isFullscreen = false,
  onFullscreenToggle,
  showProvinceMarkers = true,
  showDistrictMarkers = false,
  showCommuneMarkers = false,
  showVillageMarkers = false,
  showProvinceBoundaries = false,
  showDistrictBoundaries = false,
  showCommuneBoundaries = false,
  mapType = "osm",
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [communes, setCommunes] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [khan, setKhan] = useState<any[]>([])
  const [sangkat, setSangkat] = useState<any[]>([])
  const [provinceBoundaries, setProvinceBoundaries] = useState<any[]>([])
  const [districtBoundaries, setDistrictBoundaries] = useState<any[]>([])
  const [communeBoundaries, setCommuneBoundaries] = useState<any[]>([])
  const markersRef = useRef<any[]>([])
  const boundaryLayersRef = useRef<any[]>([])
  const tileLayerRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [L, setL] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadProvinces() {
      try {
        const { data, error } = await supabase.from("provinces").select("*").order("name_latin")

        if (error) {
          console.error("[v0] Error loading provinces:", error)
        }

        if (data && data.length > 0 && data[0].latitude && data[0].longitude) {
          setProvinces(data)
        } else {
          setProvinces(fallbackProvinces)
        }
      } catch (error) {
        console.error("[v0] Error loading provinces:", error)
        setProvinces(fallbackProvinces)
      }
    }

    loadProvinces()
  }, [supabase])

  useEffect(() => {
    async function loadDistricts() {
      if (!showDistrictMarkers) return

      try {
        const [districtsResult, khanResult] = await Promise.all([
          supabase
            .from("districts")
            .select("*")
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .order("name_latin"),
          supabase
            .from("khan")
            .select("*")
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .order("name_latin"),
        ])

        if (districtsResult.error) {
          console.error("[v0] Error loading districts:", districtsResult.error)
        } else {
          console.log("[v0] Loaded districts with coordinates:", districtsResult.data?.length || 0)
          setDistricts(districtsResult.data || [])
        }

        if (khanResult.error) {
          console.error("[v0] Error loading khan:", khanResult.error)
        } else {
          console.log("[v0] Loaded khan with coordinates:", khanResult.data?.length || 0)
          setKhan(khanResult.data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading districts/khan:", error)
        setDistricts([])
        setKhan([])
      }
    }

    loadDistricts()
  }, [supabase, showDistrictMarkers])

  useEffect(() => {
    async function loadCommunes() {
      if (!showCommuneMarkers) return

      try {
        const [communesResult, sangkatResult] = await Promise.all([
          supabase
            .from("communes")
            .select("*")
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .order("name_latin"),
          supabase
            .from("sangkat")
            .select("*")
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .order("name_latin"),
        ])

        if (communesResult.error) {
          console.error("[v0] Error loading communes:", communesResult.error)
        } else {
          console.log("[v0] Loaded communes with coordinates:", communesResult.data?.length || 0)
          setCommunes(communesResult.data || [])
        }

        if (sangkatResult.error) {
          console.error("[v0] Error loading sangkat:", sangkatResult.error)
        } else {
          console.log("[v0] Loaded sangkat with coordinates:", sangkatResult.data?.length || 0)
          setSangkat(sangkatResult.data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading communes/sangkat:", error)
        setCommunes([])
        setSangkat([])
      }
    }

    loadCommunes()
  }, [supabase, showCommuneMarkers])

  useEffect(() => {
    async function loadVillages() {
      if (!showVillageMarkers) return

      try {
        const { data, error } = await supabase
          .from("villages")
          .select("*")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("name_latin")

        if (error) {
          console.error("[v0] Error loading villages:", error)
        } else {
          console.log("[v0] Loaded villages with coordinates:", data?.length || 0)
          setVillages(data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading villages:", error)
        setVillages([])
      }
    }

    loadVillages()
  }, [supabase, showVillageMarkers])

  useEffect(() => {
    const loadLeafletFromCDN = async () => {
      if (typeof window === "undefined") return

      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          link.crossOrigin = ""
          document.head.appendChild(link)
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          script.crossOrigin = ""

          script.onload = () => {
            const leaflet = (window as any).L
            if (leaflet) {
              // Fix default marker icons
              delete leaflet.Icon.Default.prototype._getIconUrl
              leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              })

              setL(leaflet)
              setIsMapReady(true)
              console.log("[v0] Leaflet loaded successfully from CDN")
            }
          }

          script.onerror = () => {
            console.error("[v0] Failed to load Leaflet from CDN")
          }

          document.head.appendChild(script)
        } else {
          setL((window as any).L)
          setIsMapReady(true)
        }
      } catch (error) {
        console.error("[v0] Error loading Leaflet from CDN:", error)
      }
    }

    loadLeafletFromCDN()
  }, [])

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && L && isMapReady) {
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id
      }

      const mapInstance = L.map(mapRef.current, {
        center: [12.5657, 104.991],
        zoom: 7,
        zoomControl: false,
      })

      const addTileLayer = (type: "osm" | "google" | "satellite" | "hybrid") => {
        if (tileLayerRef.current) {
          mapInstance.removeLayer(tileLayerRef.current)
        }

        let tileLayer
        switch (type) {
          case "satellite":
            tileLayer = L.tileLayer(
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              {
                attribution: "© Esri, Maxar, Earthstar Geographics",
                maxZoom: 18,
              },
            )
            break
          case "hybrid":
            tileLayer = L.layerGroup([
              L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                  attribution: "© Esri, Maxar, Earthstar Geographics",
                  maxZoom: 18,
                },
              ),
              L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
                {
                  attribution: "© Esri",
                  maxZoom: 18,
                },
              ),
            ])
            break
          case "google":
            tileLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
              attribution: "© Google",
              maxZoom: 18,
            })
            break
          default:
            tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
              maxZoom: 18,
            })
        }

        tileLayer.addTo(mapInstance)
        tileLayerRef.current = tileLayer
      }

      addTileLayer(mapType)

      L.control
        .zoom({
          position: "topright",
        })
        .addTo(mapInstance)

      mapInstance.on("zoomend", () => {
        if (onZoomChange) {
          onZoomChange(mapInstance.getZoom())
        }
      })

      mapInstanceRef.current = mapInstance
      console.log("[v0] Map initialized successfully")
    }
  }, [mapType, L, isMapReady])

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker)
      }
    })
    markersRef.current = []
  }

  const addProvinceMarkers = useCallback(() => {
    if (!mapInstanceRef.current || provinces.length === 0 || !showProvinceMarkers || !L) {
      return
    }

    console.log("[v0] Adding province markers:", provinces.length)
    let markersAdded = 0

    provinces.forEach((province) => {
      console.log(
        "[v0] Processing province:",
        province.name_latin,
        "Lat:",
        province.latitude,
        "Lng:",
        province.longitude,
      )

      if (province.latitude && province.longitude) {
        try {
          const marker = L.marker([province.latitude, province.longitude])
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold">${province.name_latin} (${province.code || province.id})</h3>
                <p class="text-sm font-khmer">${province.name_khmer}</p>
                <p class="text-xs text-gray-500">Province</p>
                <p class="text-xs text-gray-400">Lat: ${province.latitude}, Lng: ${province.longitude}</p>
              </div>
            `)

          marker.on("click", () => {
            onLocationSelect?.({
              type: "province",
              name: province.name_latin,
              code: province.code || province.id,
            })
          })

          markersRef.current.push(marker)
          markersAdded++
          console.log("[v0] Successfully added marker for:", province.name_latin)
        } catch (error) {
          console.error("[v0] Error creating marker for", province.name_latin, ":", error)
        }
      } else {
        console.log("[v0] Skipping province without coordinates:", province.name_latin)
      }
    })
    console.log("[v0] Total markers added:", markersAdded)
  }, [provinces, showProvinceMarkers, onLocationSelect, L])

  useEffect(() => {
    if (mapInstanceRef.current && L) {
      clearMarkers()

      if (showProvinceMarkers && provinces.length > 0) {
        addProvinceMarkers()
      }

      if (selectedProvince) {
        const selectedProvinceData = provinces.find((p) => p.id === selectedProvince || p.code === selectedProvince)
        if (selectedProvinceData && selectedProvinceData.latitude && selectedProvinceData.longitude) {
          const selectedIcon = L.divIcon({
            className: "custom-marker-selected",
            html: `<div style="
              background-color: #ff4444;
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

          const selectedMarker = L.marker([selectedProvinceData.latitude, selectedProvinceData.longitude], {
            icon: selectedIcon,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-red-600">${selectedProvinceData.name_latin} (${selectedProvinceData.code || selectedProvinceData.id})</h3>
                <p class="text-sm font-khmer">${selectedProvinceData.name_khmer}</p>
                <p class="text-xs text-red-500">Selected Province</p>
                <p class="text-xs text-gray-400">Lat: ${selectedProvinceData.latitude}, Lng: ${selectedProvinceData.longitude}</p>
              </div>
            `)
            .openPopup()

          markersRef.current.push(selectedMarker)
          mapInstanceRef.current.setView([selectedProvinceData.latitude, selectedProvinceData.longitude], 9)
          console.log("[v0] Highlighted selected province:", selectedProvinceData.name_latin)
        }
      } else {
        mapInstanceRef.current.setView([12.5657, 104.991], 7)
      }
    }
  }, [provinces, showProvinceMarkers, selectedProvince, addProvinceMarkers, L])

  const handleFullscreen = () => {
    onFullscreenToggle?.()
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100)
    }
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full relative">
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading map from CDN...</p>
            </div>
          </div>
        )}

        {/* Map controls */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          {onFullscreenToggle && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onFullscreenToggle}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
