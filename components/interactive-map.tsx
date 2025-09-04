"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import SimpleMap from "./simple-map"

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
  const [provinces, setProvinces] = useState<any[]>([])
  const [statistics, setStatistics] = useState({
    provinces: 0,
    districts: 0,
    communes: 0,
    villages: 0,
  })

  const supabase = createClient()

  const loadProvinces = async () => {
    try {
      const { data, error } = await supabase.from("provinces").select("*").order("name_latin")

      if (error) {
        console.error("[v0] Error loading provinces:", error)
      } else {
        setProvinces(data || [])
        console.log("[v0] Loaded provinces for simple map:", data?.length || 0)
      }
    } catch (error) {
      console.error("[v0] Error loading provinces:", error)
    }
  }

  const loadStatistics = async () => {
    try {
      console.log("[v0] Loading administrative statistics...")

      const [provincesResult, districtsResult, communesResult, villagesResult] = await Promise.all([
        supabase.from("provinces").select("id", { count: "exact", head: true }),
        supabase.from("districts").select("id", { count: "exact", head: true }),
        supabase.from("communes").select("id", { count: "exact", head: true }),
        supabase.from("villages").select("id", { count: "exact", head: true }),
      ])

      setStatistics({
        provinces: provincesResult.count || 0,
        districts: districtsResult.count || 0,
        communes: communesResult.count || 0,
        villages: villagesResult.count || 0,
      })
    } catch (error) {
      console.error("[v0] Error loading statistics:", error)
    }
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
    loadProvinces()
    loadStatistics()
  }, [])

  return (
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
          <SimpleMap
            provinces={provinces}
            selectedProvince={selectedProvince}
            onLocationSelect={onLocationSelect}
            onZoomChange={setZoom}
            isFullscreen={isFullscreen}
            onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
          />
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Selected: {selectedRegions} regions</span>
          <span>Provinces: {provinces.length}</span>
          {selectedRegions === 0 ? <span>Click markers to select provinces</span> : <span>Province selected</span>}
        </div>
      </CardContent>
    </Card>
  )
}
