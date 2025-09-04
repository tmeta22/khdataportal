"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import L from "leaflet"

interface MapComponentProps {
  selectedProvince?: string
  selectedDistrict?: string
  selectedCommune?: string
  selectedVillage?: string
  onLocationSelect?: (location: { type: string; name: string; code: string }) => void
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
  showKhanMarkers?: boolean
  showSangkatMarkers?: boolean
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
  isFullscreen,
  onFullscreenToggle,
  showProvinceMarkers = true,
  showDistrictMarkers = false,
  showCommuneMarkers = false,
  showVillageMarkers = false,
  showProvinceBoundaries = false,
  showDistrictBoundaries = false,
  showCommuneBoundaries = false,
  mapType = "osm",
  showKhanMarkers = false,
  showSangkatMarkers = false,
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
  }, [supabase]) // Remove showDistrictMarkers dependency to always load data

  useEffect(() => {
    async function loadCommunes() {
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
  }, [supabase]) // Remove showCommuneMarkers dependency to always load data

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
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })
      }
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
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

        if (type === "satellite") {
          tileLayerRef.current = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
            attribution: "© Google Satellite",
            maxZoom: 20,
          }).addTo(mapInstance)
        } else if (type === "hybrid") {
          tileLayerRef.current = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
            attribution: "© Google Satellite + Labels",
            maxZoom: 20,
          }).addTo(mapInstance)
        } else if (type === "google") {
          tileLayerRef.current = L.tileLayer("https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", {
            attribution: "© Google Maps",
            maxZoom: 20,
          }).addTo(mapInstance)
        } else {
          tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapInstance)
        }
      }

      addTileLayer(mapType)

      mapInstance.on("zoomend", () => {
        const currentZoom = mapInstance.getZoom()
        onZoomChange?.(currentZoom)
      })

      mapInstanceRef.current = mapInstance
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          markersRef.current.forEach((marker) => {
            mapInstanceRef.current.removeLayer(marker)
          })
          markersRef.current = []

          if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current)
            tileLayerRef.current = null
          }

          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        } catch (error) {
          console.error("[v0] Error cleaning up map:", error)
        }
      }
    }
  }, [onZoomChange, mapType])

  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)

      if (mapType === "satellite") {
        tileLayerRef.current = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
          attribution: "© Google Satellite",
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)
      } else if (mapType === "hybrid") {
        tileLayerRef.current = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
          attribution: "© Google Satellite + Labels",
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)
      } else if (mapType === "google") {
        tileLayerRef.current = L.tileLayer("https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", {
          attribution: "© Google Maps",
          maxZoom: 20,
        }).addTo(mapInstanceRef.current)
      } else {
        tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstanceRef.current)
      }
    }
  }, [mapType])

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker)
      }
    })
    markersRef.current = []
  }

  const addProvinceMarkers = useCallback(() => {
    if (!mapInstanceRef.current || provinces.length === 0 || !showProvinceMarkers) {
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
          const customIcon = L.icon({
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })

          const marker = L.marker([province.latitude, province.longitude], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold">${province.name_latin} (${province.code || province.id})</h3>
                <p class="text-sm font-khmer">${province.name_khmer}</p>
                <p class="text-xs text-gray-500">Province</p>
                <p class="text-xs text-gray-400">Lat: ${province.latitude}, Lng: ${province.longitude}</p>
                <button onclick="handleDeletePin('province', '${province.id}')" class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                  Delete Pin
                </button>
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
  }, [provinces, showProvinceMarkers, onLocationSelect])

  const addDistrictMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !showDistrictMarkers) {
      return
    }

    const allDistricts = [...districts, ...khan]
    console.log("[v0] Adding district/khan markers:", allDistricts.length)
    let markersAdded = 0

    allDistricts.forEach((district) => {
      if (district.latitude && district.longitude) {
        try {
          const customIcon = L.icon({
            iconUrl:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#f97316"/>
                <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              </svg>
            `),
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [20, 33],
            iconAnchor: [10, 33],
            popupAnchor: [1, -28],
            shadowSize: [33, 33],
          })

          const isKhan = !district.district_id && district.province_id
          const unitType = isKhan ? "Khan" : "District"

          const marker = L.marker([district.latitude, district.longitude], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-orange-600">${district.name_latin} (${district.code || district.id})</h3>
                <p class="text-sm font-khmer">${district.name_khmer}</p>
                <p class="text-xs text-orange-500">${unitType}</p>
                <p class="text-xs text-gray-400">Lat: ${district.latitude}, Lng: ${district.longitude}</p>
                <button onclick="handleDeletePin('${isKhan ? "khan" : "district"}', '${district.id}')" class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                  Delete Pin
                </button>
              </div>
            `)

          marker.on("click", () => {
            onLocationSelect?.({
              type: isKhan ? "khan" : "district",
              name: district.name_latin,
              code: district.code || district.id,
            })
          })

          markersRef.current.push(marker)
          markersAdded++
        } catch (error) {
          console.error("[v0] Error creating district/khan marker:", error)
        }
      }
    })
    console.log("[v0] Total district/khan markers added:", markersAdded)
  }, [districts, khan, showDistrictMarkers, onLocationSelect])

  const addCommuneMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !showCommuneMarkers) {
      return
    }

    const allCommunes = [...communes, ...sangkat]
    console.log("[v0] Adding commune/sangkat markers:", allCommunes.length)
    let markersAdded = 0

    allCommunes.forEach((commune) => {
      if (commune.latitude && commune.longitude) {
        try {
          const customIcon = L.icon({
            iconUrl:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#22c55e"/>
                <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              </svg>
            `),
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [18, 29],
            iconAnchor: [9, 29],
            popupAnchor: [1, -24],
            shadowSize: [29, 29],
          })

          const isSangkat = commune.khan_id && !commune.district_id
          const unitType = isSangkat ? "Sangkat" : "Commune"

          const marker = L.marker([commune.latitude, commune.longitude], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-green-600">${commune.name_latin} (${commune.code || commune.id})</h3>
                <p class="text-sm font-khmer">${commune.name_khmer}</p>
                <p class="text-xs text-green-500">${unitType}</p>
                <p class="text-xs text-gray-400">Lat: ${commune.latitude}, Lng: ${commune.longitude}</p>
                <button onclick="handleDeletePin('${isSangkat ? "sangkat" : "commune"}', '${commune.id}')" class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                  Delete Pin
                </button>
              </div>
            `)

          marker.on("click", () => {
            onLocationSelect?.({
              type: isSangkat ? "sangkat" : "commune",
              name: commune.name_latin,
              code: commune.code || commune.id,
            })
          })

          markersRef.current.push(marker)
          markersAdded++
        } catch (error) {
          console.error("[v0] Error creating commune/sangkat marker:", error)
        }
      }
    })
    console.log("[v0] Total commune/sangkat markers added:", markersAdded)
  }, [communes, sangkat, showCommuneMarkers, onLocationSelect])

  const addVillageMarkers = useCallback(() => {
    if (!mapInstanceRef.current || villages.length === 0 || !showVillageMarkers) {
      return
    }

    console.log("[v0] Adding village markers:", villages.length)
    let markersAdded = 0

    villages.forEach((village) => {
      if (village.latitude && village.longitude) {
        try {
          const customIcon = L.icon({
            iconUrl:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#a855f7"/>
                <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              </svg>
            `),
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [15, 25],
            iconAnchor: [7, 25],
            popupAnchor: [1, -20],
            shadowSize: [25, 25],
          })

          const marker = L.marker([village.latitude, village.longitude], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-purple-600">${village.name_latin} (${village.code || village.id})</h3>
                <p class="text-sm font-khmer">${village.name_khmer}</p>
                <p class="text-xs text-purple-500">Village</p>
                <p class="text-xs text-gray-400">Lat: ${village.latitude}, Lng: ${village.longitude}</p>
                <button onclick="handleDeletePin('village', '${village.id}')" class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                  Delete Pin
                </button>
              </div>
            `)

          marker.on("click", () => {
            onLocationSelect?.({
              type: "village",
              name: village.name_latin,
              code: village.code || village.id,
            })
          })

          markersRef.current.push(marker)
          markersAdded++
        } catch (error) {
          console.error("[v0] Error creating village marker:", error)
        }
      }
    })
    console.log("[v0] Total village markers added:", markersAdded)
  }, [villages, showVillageMarkers, onLocationSelect])

  useEffect(() => {
    async function loadBoundaries() {
      try {
        if (showProvinceBoundaries) {
          const { data: provinceBoundaryData } = await supabase.from("province_boundaries").select(`
              id,
              geojson,
              properties,
              provinces!inner(id, code, name_latin, name_khmer)
            `)
          setProvinceBoundaries(provinceBoundaryData || [])
        }

        if (showDistrictBoundaries) {
          const { data: districtBoundaryData } = await supabase.from("district_boundaries").select(`
              id,
              geojson,
              properties,
              districts!inner(id, code, name_latin, name_khmer)
            `)
          setDistrictBoundaries(districtBoundaryData || [])
        }

        if (showCommuneBoundaries) {
          const { data: communeBoundaryData } = await supabase.from("commune_boundaries").select(`
              id,
              geojson,
              properties,
              communes!inner(id, code, name_latin, name_khmer)
            `)
          setCommuneBoundaries(communeBoundaryData || [])
        }
      } catch (error) {
        console.error("[v0] Error loading boundaries:", error)
      }
    }

    loadBoundaries()
  }, [supabase, showProvinceBoundaries, showDistrictBoundaries, showCommuneBoundaries])

  const handleDeletePin = async (type: string, id: string) => {
    try {
      let tableName = `${type}s`
      if (type === "khan") tableName = "khan"
      if (type === "sangkat") tableName = "sangkat"

      const { error } = await supabase.from(tableName).update({ latitude: null, longitude: null }).eq("id", id)

      if (error) {
        console.error("[v0] Error deleting pin:", error)
      } else {
        console.log("[v0] Successfully deleted pin for:", type, id)
        if (type === "province") {
          // Reload provinces function would need to be created
        } else if (type === "district" || type === "khan") {
          window.location.reload()
        } else if (type === "commune" || type === "sangkat") {
          window.location.reload()
        } else if (type === "village") {
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("[v0] Error deleting pin:", error)
    }
  }

  const addBoundaryLayers = useCallback(() => {
    if (!mapInstanceRef.current) return

    boundaryLayersRef.current.forEach((layer) => {
      mapInstanceRef.current.removeLayer(layer)
    })
    boundaryLayersRef.current = []

    if (showProvinceBoundaries && provinceBoundaries.length > 0) {
      provinceBoundaries.forEach((boundary) => {
        if (boundary.geojson) {
          const layer = L.geoJSON(boundary.geojson, {
            style: {
              color: "#3b82f6",
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.1,
            },
          }).addTo(mapInstanceRef.current)

          layer.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-blue-600">${boundary.provinces?.name_latin}</h3>
              <p class="text-xs text-blue-500">Province Boundary</p>
            </div>
          `)

          boundaryLayersRef.current.push(layer)
        }
      })
    }

    if (showDistrictBoundaries && districtBoundaries.length > 0) {
      districtBoundaries.forEach((boundary) => {
        if (boundary.geojson) {
          const layer = L.geoJSON(boundary.geojson, {
            style: {
              color: "#f97316",
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.1,
            },
          }).addTo(mapInstanceRef.current)

          layer.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-orange-600">${boundary.districts?.name_latin}</h3>
              <p class="text-xs text-orange-500">District Boundary</p>
            </div>
          `)

          boundaryLayersRef.current.push(layer)
        }
      })
    }

    if (showCommuneBoundaries && communeBoundaries.length > 0) {
      communeBoundaries.forEach((boundary) => {
        if (boundary.geojson) {
          const layer = L.geoJSON(boundary.geojson, {
            style: {
              color: "#22c55e",
              weight: 1,
              opacity: 0.8,
              fillOpacity: 0.1,
            },
          }).addTo(mapInstanceRef.current)

          layer.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-green-600">${boundary.communes?.name_latin}</h3>
              <p class="text-xs text-green-500">Commune Boundary</p>
            </div>
          `)

          boundaryLayersRef.current.push(layer)
        }
      })
    }
  }, [
    showProvinceBoundaries,
    showDistrictBoundaries,
    showCommuneBoundaries,
    provinceBoundaries,
    districtBoundaries,
    communeBoundaries,
  ])

  useEffect(() => {
    if (mapInstanceRef.current) {
      clearMarkers()

      addBoundaryLayers()

      if (showProvinceMarkers && provinces.length > 0) {
        addProvinceMarkers()
      }
      if (showKhanMarkers && khan.length > 0) {
        addDistrictMarkers()
      }
      if (showDistrictMarkers && districts.length > 0) {
        addDistrictMarkers()
      }
      if (showSangkatMarkers && sangkat.length > 0) {
        addCommuneMarkers()
      }
      if (showCommuneMarkers && communes.length > 0) {
        addCommuneMarkers()
      }
      if (showVillageMarkers && villages.length > 0) {
        addVillageMarkers()
      }

      if (selectedProvince) {
        const selectedProvinceData = provinces.find((p) => p.id === selectedProvince || p.code === selectedProvince)
        if (selectedProvinceData && selectedProvinceData.latitude && selectedProvinceData.longitude) {
          const selectedIcon = L.icon({
            iconUrl:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#ff4444"/>
                <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              </svg>
            `),
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
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
  }, [
    provinces,
    districts,
    communes,
    villages,
    khan,
    sangkat,
    showProvinceMarkers,
    showDistrictMarkers,
    showKhanMarkers, // Add showKhanMarkers dependency
    showCommuneMarkers,
    showSangkatMarkers, // Add showSangkatMarkers dependency
    showVillageMarkers,
    showProvinceBoundaries,
    showDistrictBoundaries,
    showCommuneBoundaries,
    selectedProvince,
    addProvinceMarkers,
    addDistrictMarkers,
    addCommuneMarkers,
    addVillageMarkers,
    addBoundaryLayers,
  ])

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut()
    }
  }

  const handleFullscreen = () => {
    onFullscreenToggle?.()
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).handleDeletePin = handleDeletePin
    }
  }, [])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />

      <div className="absolute top-2 right-2 z-[1002] flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn} className="bg-white/90 backdrop-blur-sm">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut} className="bg-white/90 backdrop-blur-sm">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleFullscreen} className="bg-white/90 backdrop-blur-sm">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <div ref={mapRef} className="w-full h-full" />

      <style jsx>{`
        .selected-marker {
          filter: hue-rotate(240deg) brightness(1.2);
        }
      `}</style>
    </>
  )
}
