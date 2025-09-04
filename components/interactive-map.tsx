"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapIcon, MapPin, Satellite, MapIcon as MapIconLucide, Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { EnhancedMapLegend } from "./enhanced-map-legend"

interface InteractiveMapProps {
  selectedProvince?: string
  selectedDistrict?: string
  selectedCommune?: string
  selectedVillage?: string
  onLocationSelect?: (location: { type: string; name: string; code: string }) => void
}

const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <MapIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
})

export function InteractiveMap({
  selectedProvince,
  selectedDistrict,
  selectedCommune,
  selectedVillage,
  onLocationSelect,
}: InteractiveMapProps) {
  const [zoom, setZoom] = useState(7)
  const [selectedRegions, setSelectedRegions] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showProvinceMarkers, setShowProvinceMarkers] = useState(true)
  const [showDistrictMarkers, setShowDistrictMarkers] = useState(false)
  const [showKhanMarkers, setShowKhanMarkers] = useState(false)
  const [showCommuneMarkers, setShowCommuneMarkers] = useState(false)
  const [showSangkatMarkers, setShowSangkatMarkers] = useState(false)
  const [showVillageMarkers, setShowVillageMarkers] = useState(false)
  const [selectedProvinceData, setSelectedProvinceData] = useState<any>(null)
  const [selectedDistrictData, setSelectedDistrictData] = useState<any>(null)
  const [selectedCommuneData, setSelectedCommuneData] = useState<any>(null)
  const [selectedVillageData, setSelectedVillageData] = useState<any>(null)
  const [mapType, setMapType] = useState<"osm" | "google" | "satellite" | "hybrid">("osm")
  const [legendVisible, setLegendVisible] = useState(true)
  const [satelliteMode, setSatelliteMode] = useState<"satellite" | "hybrid">("satellite")
  const [statistics, setStatistics] = useState({
    provinces: 0,
    districts: 0,
    khan: 0,
    communes: 0,
    sangkat: 0,
    villages: 0,
  })
  const [showProvinceBoundaries, setShowProvinceBoundaries] = useState(false)
  const [showDistrictBoundaries, setShowDistrictBoundaries] = useState(false)
  const [showCommuneBoundaries, setShowCommuneBoundaries] = useState(false)

  const supabase = createClient()

  const loadStatistics = async () => {
    try {
      console.log("[v0] Loading administrative statistics...")

      const [provincesResult, districtsResult, khanResult, communesResult, sangkatResult, villagesResult] =
        await Promise.all([
          supabase.from("provinces").select("id", { count: "exact", head: true }),
          supabase.from("districts").select("id", { count: "exact", head: true }),
          supabase.from("khan").select("id", { count: "exact", head: true }),
          supabase.from("communes").select("id", { count: "exact", head: true }),
          supabase.from("sangkat").select("id", { count: "exact", head: true }),
          supabase.from("villages").select("id", { count: "exact", head: true }),
        ])

      setStatistics({
        provinces: provincesResult.count || 0,
        districts: districtsResult.count || 0,
        khan: khanResult.count || 0,
        communes: communesResult.count || 0,
        sangkat: sangkatResult.count || 0,
        villages: villagesResult.count || 0,
      })

      console.log("[v0] Statistics loaded:", {
        provinces: provincesResult.count,
        districts: districtsResult.count,
        khan: khanResult.count,
        communes: communesResult.count,
        sangkat: sangkatResult.count,
        villages: villagesResult.count,
      })
    } catch (error) {
      console.error("[v0] Error loading statistics:", error)
    }
  }

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    console.log("[v0] Layer toggle:", layer, enabled)

    switch (layer) {
      case "provinces":
        setShowProvinceMarkers(enabled)
        break
      case "districts":
        setShowDistrictMarkers(enabled)
        break
      case "khan":
        setShowKhanMarkers(enabled)
        break
      case "communes":
        setShowCommuneMarkers(enabled)
        break
      case "sangkat":
        setShowSangkatMarkers(enabled)
        break
      case "villages":
        setShowVillageMarkers(enabled)
        break
      case "provinceBoundaries":
        setShowProvinceBoundaries(enabled)
        break
      case "districtBoundaries":
        setShowDistrictBoundaries(enabled)
        break
      case "communeBoundaries":
        setShowCommuneBoundaries(enabled)
        break
    }

    setLegendVisible(true)
  }

  const layerStates = {
    provinces: showProvinceMarkers,
    districts: showDistrictMarkers,
    khan: showKhanMarkers,
    communes: showCommuneMarkers,
    sangkat: showSangkatMarkers,
    villages: showVillageMarkers,
    provinceBoundaries: showProvinceBoundaries,
    districtBoundaries: showDistrictBoundaries,
    communeBoundaries: showCommuneBoundaries,
  }

  const resolveAdministrativeNames = async () => {
    try {
      // Resolve province
      if (selectedProvince) {
        const { data: provinceData } = await supabase.from("provinces").select("*").eq("id", selectedProvince).single()

        if (provinceData) {
          setSelectedProvinceData(provinceData)
        }
      }

      // Resolve district
      if (selectedDistrict) {
        const { data: districtData } = await supabase
          .from("districts")
          .select("*, provinces(name_latin, name_khmer)")
          .eq("id", selectedDistrict)
          .single()

        if (districtData) {
          setSelectedDistrictData(districtData)
        }
      }

      // Resolve commune
      if (selectedCommune) {
        const { data: communeData } = await supabase
          .from("communes")
          .select("*, districts(name_latin, name_khmer, provinces(name_latin, name_khmer))")
          .eq("id", selectedCommune)
          .single()

        if (communeData) {
          setSelectedCommuneData(communeData)
        }
      }

      // Resolve village
      if (selectedVillage) {
        const { data: villageData } = await supabase
          .from("villages")
          .select(
            "*, communes(name_latin, name_khmer, districts(name_latin, name_khmer, provinces(name_latin, name_khmer)))",
          )
          .eq("id", selectedVillage)
          .single()

        if (villageData) {
          setSelectedVillageData(villageData)
        }
      }
    } catch (error) {
      console.error("[v0] Error resolving administrative names:", error)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setLegendVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [
    zoom,
    mapType,
    showProvinceMarkers,
    showDistrictMarkers,
    showKhanMarkers,
    showCommuneMarkers,
    showSangkatMarkers,
    showVillageMarkers,
  ])

  useEffect(() => {
    let count = 0
    if (selectedProvince) count++
    if (selectedDistrict) count++
    if (selectedCommune) count++
    if (selectedVillage) count++
    setSelectedRegions(count)
  }, [selectedProvince, selectedDistrict, selectedCommune, selectedVillage])

  useEffect(() => {
    resolveAdministrativeNames()
  }, [selectedProvince, selectedDistrict, selectedCommune, selectedVillage])

  useEffect(() => {
    loadStatistics()
  }, [])

  return (
    <div className={isFullscreen ? "fixed inset-4 z-40" : ""}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant={mapType === "osm" ? "default" : "outline"} size="sm" onClick={() => setMapType("osm")}>
            <MapIconLucide className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Map</span>
          </Button>
          <Button
            variant={mapType === "satellite" || mapType === "hybrid" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (mapType === "osm") {
                setMapType(satelliteMode)
              } else if (mapType === "satellite") {
                setSatelliteMode("hybrid")
                setMapType("hybrid")
              } else if (mapType === "hybrid") {
                setSatelliteMode("satellite")
                setMapType("satellite")
              }
            }}
          >
            <Satellite className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{mapType === "hybrid" ? "Satellite + Labels" : "Satellite"}</span>
            <span className="sm:hidden">{mapType === "hybrid" ? "Sat+" : "Sat"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLegendVisible(!legendVisible)}
            title={legendVisible ? "Hide Legend" : "Show Legend"}
          >
            {legendVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        {legendVisible && (
          <div className="max-w-sm">
            <EnhancedMapLegend onLayerToggle={handleLayerToggle} layerStates={layerStates} statistics={statistics} />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapIcon className="w-5 h-5" />
              <span>Interactive Map</span>
              <span className="text-sm font-normal text-muted-foreground">Zoom: {zoom}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`relative rounded-lg overflow-hidden ${isFullscreen ? "h-[calc(100vh-200px)]" : "h-96"}`}>
            <MapComponent
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              selectedCommune={selectedCommune}
              selectedVillage={selectedVillage}
              onLocationSelect={onLocationSelect}
              onZoomChange={setZoom}
              isFullscreen={isFullscreen}
              onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
              showProvinceMarkers={showProvinceMarkers}
              showDistrictMarkers={showDistrictMarkers}
              showKhanMarkers={showKhanMarkers}
              showCommuneMarkers={showCommuneMarkers}
              showSangkatMarkers={showSangkatMarkers}
              showVillageMarkers={showVillageMarkers}
              showProvinceBoundaries={showProvinceBoundaries}
              showDistrictBoundaries={showDistrictBoundaries}
              showCommuneBoundaries={showCommuneBoundaries}
              mapType={mapType}
            />

            {(selectedProvinceData || selectedDistrictData || selectedCommuneData || selectedVillageData) && (
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm z-[1001] border">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium">Selected Location</p>
                </div>
                {selectedProvinceData && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedProvinceData.name_latin} ({selectedProvinceData.name_khmer})
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Population:</span>{" "}
                        {selectedProvinceData.population?.toLocaleString() || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Area:</span>{" "}
                        {selectedProvinceData.area?.toLocaleString() || "N/A"} km²
                      </p>
                      <p>
                        <span className="font-medium">Coordinates:</span> {selectedProvinceData.latitude},{" "}
                        {selectedProvinceData.longitude}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {selectedProvinceData.type || "Province"}
                      </p>
                    </div>
                  </div>
                )}
                {selectedDistrictData && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">District:</span> {selectedDistrictData.name_latin} (
                    {selectedDistrictData.name_khmer})
                  </p>
                )}
                {selectedCommuneData && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Commune:</span> {selectedCommuneData.name_latin} (
                    {selectedCommuneData.name_khmer})
                  </p>
                )}
                {selectedVillageData && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Village:</span> {selectedVillageData.name_latin} (
                    {selectedVillageData.name_khmer})
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Selected: {selectedRegions} regions</span>
            <span>
              Layers:{" "}
              {[
                showProvinceMarkers && "Provinces",
                showDistrictMarkers && "Districts",
                showKhanMarkers && "Khan",
                showCommuneMarkers && "Communes",
                showSangkatMarkers && "Sangkat",
                showVillageMarkers && "Villages",
              ]
                .filter(Boolean)
                .join(", ") || "None"}
            </span>
            {selectedRegions === 0 ? (
              <span>Select a region to view markers</span>
            ) : (
              <span>Click markers for details</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
