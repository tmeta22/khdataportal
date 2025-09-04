"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapIcon, Map, Satellite, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import LeafletMap from "./leaflet-map"
import { EnhancedMapLegend } from "./enhanced-map-legend"

interface InteractiveMapProps {
  selectedProvince?: string
  selectedDistrict?: string
  selectedCommune?: string
  selectedVillage?: string
  onLocationSelect?: (location: { type: string; name: string; code: string }) => void
}

export function InteractiveMap({
  selectedProvince,
  selectedDistrict,
  selectedCommune,
  selectedVillage,
  onLocationSelect,
}: InteractiveMapProps) {
  const [zoom, setZoom] = useState(1)
  const [selectedRegions, setSelectedRegions] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTileLayer, setCurrentTileLayer] = useState("osm")
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [communes, setCommunesData] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [khan, setKhan] = useState<any[]>([])
  const [sangkat, setSangkat] = useState<any[]>([])
  const [boundaries, setBoundaries] = useState<any[]>([])

  const [layerStates, setLayerStates] = useState({
    provinces: true,
    districts: false,
    communes: false,
    villages: false,
    khan: false,
    sangkat: false,
    provinceBoundaries: false,
    districtBoundaries: false,
    communeBoundaries: false,
  })

  const [statistics, setStatistics] = useState({
    provinces: 0,
    districts: 0,
    communes: 0,
    villages: 0,
    khan: 0,
    sangkat: 0,
  })

  const supabase = createClient()

  const loadAllAdministrativeData = async () => {
    try {
      console.log("[v0] Loading all administrative data...")

      const [
        provincesResult,
        districtsResult,
        communesResult,
        villagesResult,
        khanResult,
        sangkatResult,
        boundariesResult,
      ] = await Promise.all([
        supabase.from("provinces").select("*").order("code"),
        supabase.from("districts").select("*").order("code"),
        supabase.from("communes").select("*").order("code"),
        supabase.from("villages").select("*").order("code"),
        supabase.from("khan").select("*").order("code"),
        supabase.from("sangkat").select("*").order("code"),
        supabase.from("province_boundaries").select("*"),
      ])

      if (provincesResult.data) setProvinces(provincesResult.data)
      if (districtsResult.data) setDistricts(districtsResult.data)
      if (communesResult.data) setCommunesData(communesResult.data)
      if (villagesResult.data) setVillages(villagesResult.data)
      if (khanResult.data) setKhan(khanResult.data)
      if (sangkatResult.data) setSangkat(sangkatResult.data)
      if (boundariesResult.data) setBoundaries(boundariesResult.data)

      console.log("[v0] Loaded administrative data:", {
        provinces: provincesResult.data?.length || 0,
        districts: districtsResult.data?.length || 0,
        communes: communesResult.data?.length || 0,
        villages: villagesResult.data?.length || 0,
        khan: khanResult.data?.length || 0,
        sangkat: sangkatResult.data?.length || 0,
        boundaries: boundariesResult.data?.length || 0,
      })
    } catch (error) {
      console.error("[v0] Error loading administrative data:", error)
    }
  }

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

      const totalDistricts = (districtsResult.count || 0) + (khanResult.count || 0)
      const totalCommunes = (communesResult.count || 0) + (sangkatResult.count || 0)

      setStatistics({
        provinces: provincesResult.count || 0,
        districts: totalDistricts,
        communes: totalCommunes,
        villages: villagesResult.count || 0,
        khan: khanResult.count || 0,
        sangkat: sangkatResult.count || 0,
      })

      console.log("[v0] Loaded statistics:", {
        provinces: provincesResult.count || 0,
        districts: totalDistricts,
        communes: totalCommunes,
        villages: villagesResult.count || 0,
        khan: khanResult.count || 0,
        sangkat: sangkatResult.count || 0,
      })
    } catch (error) {
      console.error("[v0] Error loading statistics:", error)
    }
  }

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    setLayerStates((prev) => ({
      ...prev,
      [layer]: enabled,
    }))
    console.log("[v0] Layer toggled:", layer, enabled)
  }

  useEffect(() => {
    let count = 0
    if (selectedProvince) count++
    if (selectedDistrict) count++
    if (selectedCommune) count++
    if (selectedVillage) count++
    setSelectedRegions(count)
  }, [selectedProvince, selectedDistrict, selectedCommune, selectedVillage])

  useEffect(() => {
    loadAllAdministrativeData()
    loadStatistics()
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <EnhancedMapLegend onLayerToggle={handleLayerToggle} layerStates={layerStates} statistics={statistics} />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex justify-end">
          <div className="flex gap-1 bg-white rounded-lg shadow-lg p-1 border">
            <Button
              variant={currentTileLayer === "osm" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentTileLayer("osm")}
              className="text-xs"
            >
              <Map className="w-4 h-4 mr-1" />
              Map
            </Button>
            <Button
              variant={currentTileLayer === "satellite" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentTileLayer("satellite")}
              className="text-xs"
            >
              <Satellite className="w-4 h-4 mr-1" />
              Satellite
            </Button>
            <Button
              variant={currentTileLayer === "hybrid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentTileLayer("hybrid")}
              className="text-xs"
            >
              <Eye className="w-4 h-4 mr-1" />
              Satellite + Labels
            </Button>
          </div>
        </div>

        <Card className={isFullscreen ? "fixed inset-4 z-40" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MapIcon className="w-5 h-5" />
                <span>Interactive Map</span>
                <span className="text-sm font-normal text-muted-foreground">Zoom: {zoom.toFixed(1)}x</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`relative rounded-lg overflow-hidden ${isFullscreen ? "h-[calc(100vh-200px)]" : "h-96"}`}>
              <LeafletMap
                provinces={provinces}
                districts={districts}
                communes={communes}
                villages={villages}
                khan={khan}
                sangkat={sangkat}
                boundaries={boundaries}
                layerStates={layerStates}
                selectedProvince={selectedProvince}
                onLocationSelect={onLocationSelect}
                onZoomChange={setZoom}
                isFullscreen={isFullscreen}
                onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
                currentTileLayer={currentTileLayer}
              />
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Selected: {selectedRegions} regions</span>
              <span>
                Total Locations:{" "}
                {statistics.provinces +
                  statistics.districts +
                  statistics.communes +
                  statistics.villages +
                  statistics.khan +
                  statistics.sangkat}
              </span>
              {selectedRegions === 0 ? <span>Click markers to select locations</span> : <span>Location selected</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
