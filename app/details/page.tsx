"use client"

import { useRouter } from "next/navigation"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Users, BarChart3, Map, Download, Share, Edit, Save, X, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import CensusImportDetails from "@/components/census-import-details"

const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

const RecentUpdates = dynamic(() => import("@/components/recent-updates"), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  ),
})

interface Province {
  id: string
  code: string
  name_latin: string
  name_khmer: string
  population: number
  area: number
  subdivisions: number
  latitude: number
  longitude: number
  elevation: number
  established: number | null
  description: string
  type: string
  reference: string
  official_note: string
  note_by_checker: string
}

interface CensusData {
  id: string
  province_name: string
  total?: number
  males?: number
  females?: number
  households?: number
  household_size?: number
  area_km2?: number
  pop_km2?: number
}

export default function DetailsPage() {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [censusData, setCensusData] = useState<CensusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Province>>({})
  const { isAuthenticated } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadProvinces()
  }, [])

  useEffect(() => {
    if (selectedProvince) {
      const timer = setTimeout(() => {
        loadCensusData(selectedProvince.name_latin)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedProvince])

  const loadCensusData = async (provinceName: string) => {
    try {
      console.log("[v0] Loading census data for province:", provinceName)

      let census = null
      let attempts = 0
      const maxAttempts = 3

      while (!census && attempts < maxAttempts) {
        attempts++
        console.log(`[v0] Census data loading attempt ${attempts} for:`, provinceName)

        const queries = [
          supabase.from("census_data").select("*").eq("provinces", provinceName).maybeSingle(),
          supabase.from("census_data").select("*").ilike("provinces", provinceName).maybeSingle(),
          supabase.from("census_data").select("*").ilike("provinces", `${provinceName} Province`).maybeSingle(),
          supabase
            .from("census_data")
            .select("*")
            .ilike("provinces", provinceName.replace(" Province", ""))
            .maybeSingle(),
          supabase
            .from("census_data")
            .select("*")
            .or(`provinces.ilike.%${provinceName}%,provinces_kh.ilike.%${provinceName}%`)
            .maybeSingle(),
          selectedProvince?.code
            ? supabase.from("census_data").select("*").eq("pro_code", selectedProvince.code).maybeSingle()
            : null,
        ].filter(Boolean)

        for (const query of queries) {
          try {
            const result = await query
            if (result.data && !result.error) {
              census = result.data
              console.log("[v0] Census data found using query strategy on attempt", attempts)
              break
            }
          } catch (queryError) {
            console.warn("[v0] Query failed:", queryError)
          }
        }

        if (!census && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (census) {
        console.log("[v0] Census data loaded successfully:", census)
        setCensusData(census)
      } else {
        console.log("[v0] No census data found after", attempts, "attempts for:", provinceName)
        const { data: allCensus } = await supabase.from("census_data").select("provinces, pro_code").limit(5)
        console.log(
          "[v0] Sample available census provinces:",
          allCensus?.map((c) => c.provinces),
        )
        setCensusData(null)
      }
    } catch (error) {
      console.error("[v0] Error loading census data:", error)
      setCensusData(null)
    }
  }

  const loadProvinces = async () => {
    try {
      console.log("[v0] Loading provinces data from database...")

      const { data: provincesData, error } = await supabase.from("provinces").select("*").order("name_latin")

      if (error) {
        console.error("[v0] Error loading provinces from database:", error)
        setProvinces([])
        setSelectedProvince(null)
        console.log("[v0] No provinces loaded due to database error")
      } else {
        const transformedProvinces: Province[] = await Promise.all(
          provincesData.map(async (p) => {
            let totalSubdivisions = 0

            const { count: districtsCount } = await supabase
              .from("districts")
              .select("*", { count: "exact", head: true })
              .eq("province_id", p.id)

            totalSubdivisions += districtsCount || 0

            if (p.name_latin === "Phnom Penh Capital" || p.code === "12") {
              const { count: khanCount } = await supabase.from("khan").select("*", { count: "exact", head: true })
              totalSubdivisions += khanCount || 0
              console.log(`[v0] Khan count for ${p.name_latin}:`, khanCount)
            }

            const { data: districtIds } = await supabase.from("districts").select("id").eq("province_id", p.id)
            const districtIdList = districtIds?.map((d) => d.id) || []

            let communesCount = 0
            if (districtIdList.length > 0) {
              const { count } = await supabase
                .from("communes")
                .select("*", { count: "exact", head: true })
                .in("district_id", districtIdList)
              communesCount = count || 0
            }
            totalSubdivisions += communesCount

            if (p.name_latin === "Phnom Penh Capital" || p.code === "12") {
              const { count: sangkatCount } = await supabase.from("sangkat").select("*", { count: "exact", head: true })
              totalSubdivisions += sangkatCount || 0
              console.log(`[v0] Sangkat count for ${p.name_latin}:`, sangkatCount)
            }

            const { data: communeIds } = await supabase.from("communes").select("id").in("district_id", districtIdList)

            const { data: sangkatIds } =
              p.name_latin === "Phnom Penh Capital" || p.code === "12"
                ? await supabase.from("sangkat").select("id")
                : { data: [] }

            const allCommuneIds = [...(communeIds?.map((c) => c.id) || []), ...(sangkatIds?.map((s) => s.id) || [])]

            let villagesCount = 0
            if (allCommuneIds.length > 0) {
              const { count } = await supabase
                .from("villages")
                .select("*", { count: "exact", head: true })
                .in("commune_id", allCommuneIds)
              villagesCount = count || 0
            }
            totalSubdivisions += villagesCount

            if (p.name_latin === "Phnom Penh Capital") {
              console.log(`[v0] Total subdivisions for ${p.name_latin}:`, {
                districts: districtsCount,
                communes: communesCount,
                villages: villagesCount,
                total: totalSubdivisions,
              })
            }

            return {
              id: p.id,
              code: p.code,
              name_latin: p.name_latin,
              name_khmer: p.name_khmer,
              population: p.population || 0,
              area: p.area || 0,
              subdivisions: totalSubdivisions,
              latitude: p.latitude || 0,
              longitude: p.longitude || 0,
              elevation: p.elevation || 0,
              established: p.established || null,
              description: p.description || `${p.name_latin} is a province in Cambodia.`,
              type: p.type || "province",
              reference: p.reference || "",
              official_note: p.official_note || "",
              note_by_checker: p.note_by_checker || "",
            }
          }),
        )

        setProvinces(transformedProvinces)
        setSelectedProvince(transformedProvinces[0])
        console.log("[v0] Loaded provinces from database:", transformedProvinces.length)
      }
    } catch (error) {
      console.error("[v0] Error loading provinces:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (province: Province) => {
    setEditForm(province)
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      console.log("[v0] Saving province data:", editForm)

      if (editForm.id) {
        const updatedProvinces = provinces.map((p) => (p.id === editForm.id ? { ...p, ...editForm } : p))
        setProvinces(updatedProvinces)

        if (selectedProvince?.id === editForm.id) {
          setSelectedProvince({ ...selectedProvince, ...editForm } as Province)
        }
      }

      setEditDialogOpen(false)
      console.log("[v0] Province data saved successfully")
    } catch (error) {
      console.error("[v0] Error saving province:", error)
    }
  }

  const handleViewOnMap = () => {
    if (selectedProvince) {
      router.push(
        `/map?province=${selectedProvince.id}&lat=${selectedProvince.latitude}&lng=${selectedProvince.longitude}`,
      )
    }
  }

  const handleExportData = () => {
    if (selectedProvince) {
      const data = {
        id: selectedProvince.id,
        code: selectedProvince.code,
        name_latin: selectedProvince.name_latin,
        name_khmer: selectedProvince.name_khmer,
        population: selectedProvince.population,
        area: selectedProvince.area,
        subdivisions: selectedProvince.subdivisions,
        latitude: selectedProvince.latitude,
        longitude: selectedProvince.longitude,
        elevation: selectedProvince.elevation,
        established: selectedProvince.established,
        type: selectedProvince.type,
        description: selectedProvince.description,
        reference: selectedProvince.reference,
        official_note: selectedProvince.official_note,
        note_by_checker: selectedProvince.note_by_checker,
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedProvince.name_latin.replace(/\s+/g, "_")}_data.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleCensusImportComplete = () => {
    if (selectedProvince) {
      loadCensusData(selectedProvince.name_latin)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading provinces data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <Label htmlFor="province-select" className="text-sm font-medium mb-2 block">
          Select Province
        </Label>
        <Select
          value={selectedProvince?.id || ""}
          onValueChange={(value) => {
            const province = provinces.find((p) => p.id === value)
            setSelectedProvince(province || null)
          }}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose a province..." />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                <div className="flex items-center space-x-2">
                  <span>{province.name_latin}</span>
                  <span className="font-khmer text-muted-foreground">({province.name_khmer})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProvince && (
        <>
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <span>Cambodia</span>
            <span>→</span>
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-foreground font-medium">{selectedProvince.name_latin}</span>
          </nav>

          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={selectedProvince.type === "capital" ? "bg-purple-600" : "bg-blue-600"}>
                  {selectedProvince.type === "capital" ? "Capital" : "Province"}
                </Badge>
                <span className="text-sm text-muted-foreground">{selectedProvince.code}</span>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{selectedProvince.name_latin}</h1>
              <p className="font-khmer text-xl text-muted-foreground mb-4">{selectedProvince.name_khmer}</p>
            </div>

            <div className="flex gap-2">
              {isAuthenticated && (
                <Button variant="outline" onClick={() => handleEdit(selectedProvince)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              )}
              <Button variant="outline" onClick={handleViewOnMap}>
                <Map className="w-4 h-4 mr-2" />
                View on Map
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Population</p>
                  <p className="text-2xl font-bold">
                    {censusData?.total
                      ? censusData.total.toLocaleString()
                      : selectedProvince.population.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="text-2xl font-bold">
                    {censusData?.area_km2
                      ? `${censusData.area_km2.toLocaleString()} km²`
                      : `${selectedProvince.area.toLocaleString()} km²`}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sub-divisions</p>
                  <p className="text-2xl font-bold">{selectedProvince.subdivisions}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="demographics">Demographics</TabsTrigger>
                  <TabsTrigger value="subdivisions">Sub-divisions</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic Data</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Description</h3>
                      {isAuthenticated && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedProvince)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{selectedProvince.description}</p>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Administrative Information</h4>
                        {isAuthenticated && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedProvince)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Gazetteer Code</label>
                            <p className="text-lg">{selectedProvince.code}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Administrative Level</label>
                            <p className="text-lg capitalize">{selectedProvince.type}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Parent Region</label>
                            <p className="text-lg">Cambodia</p>
                          </div>
                          {selectedProvince.established && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Established</label>
                              <p className="text-lg">{selectedProvince.established}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Geographic Information</h4>
                        {isAuthenticated && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedProvince)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Latitude</label>
                            <p className="text-lg">{selectedProvince.latitude.toFixed(4)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Longitude</label>
                            <p className="text-lg">{selectedProvince.longitude.toFixed(4)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Total Area</label>
                            <p className="text-lg">{selectedProvince.area.toLocaleString()} km²</p>
                          </div>
                          {selectedProvince.elevation > 0 && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Elevation</label>
                              <p className="text-lg">{selectedProvince.elevation}m</p>
                            </div>
                          )}
                          {selectedProvince.reference && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Reference</label>
                              <p className="text-sm">{selectedProvince.reference}</p>
                            </div>
                          )}
                          {selectedProvince.official_note && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Official Note</label>
                              <p className="text-sm">{selectedProvince.official_note}</p>
                            </div>
                          )}
                          {selectedProvince.note_by_checker && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Note by Checker</label>
                              <p className="text-sm">{selectedProvince.note_by_checker}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="demographics">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Statistical Overview</h3>
                      {isAuthenticated && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedProvince)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {censusData ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground mb-3">Population Statistics</h4>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Population</span>
                              <span className="font-medium">{censusData.total?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Males</span>
                              <span className="font-medium">{censusData.males?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Females</span>
                              <span className="font-medium">{censusData.females?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Population Density</span>
                              <span className="font-medium">
                                {censusData.pop_km2 ? `${Math.round(censusData.pop_km2)}/km²` : "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground mb-3">Household Statistics</h4>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Households</span>
                              <span className="font-medium">{censusData.households?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Average Household Size</span>
                              <span className="font-medium">
                                {censusData.household_size ? `${censusData.household_size} persons` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Area</span>
                              <span className="font-medium">
                                {censusData.area_km2 ? `${censusData.area_km2.toLocaleString()} km²` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sub-divisions</span>
                              <span className="font-medium">{selectedProvince.subdivisions}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Data source: Provisional Census 2019, National Institute of Statistics, Ministry of
                            Planning, Kingdom of Cambodia
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Population</span>
                            <span className="font-medium">{selectedProvince.population.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Population Density</span>
                            <span className="font-medium">
                              {selectedProvince.area > 0
                                ? Math.round(selectedProvince.population / selectedProvince.area)
                                : 0}
                              /km²
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Households</span>
                            <span className="font-medium">
                              {Math.round(selectedProvince.population / 4).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sub-divisions</span>
                            <span className="font-medium">{selectedProvince.subdivisions}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Census data not available for this province. Showing estimated values from administrative
                            records.
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="subdivisions">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Sub-divisions ({selectedProvince.subdivisions})</h3>
                      {isAuthenticated && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedProvince)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground">Child Regions calculated from system data</p>
                  </Card>
                </TabsContent>

                <TabsContent value="geographic">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Geographic Data</h3>
                      {isAuthenticated && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedProvince)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground">Geographic information and coordinates</p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleViewOnMap}>
                    <Map className="w-4 h-4 mr-2" />
                    View on Map
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Share className="w-4 h-4 mr-2" />
                    Search Sub-regions
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <CensusImportDetails
                    provinceName={selectedProvince.name_latin}
                    onImportComplete={handleCensusImportComplete}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Location Map</h3>
                <div className="aspect-square bg-muted rounded-lg relative overflow-hidden">
                  {selectedProvince && <LocationMap key={selectedProvince.id} province={selectedProvince} />}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Province Details</DialogTitle>
            <DialogDescription>Update the administrative information for {editForm.name_latin}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_latin">Name (Latin)</Label>
              <Input
                id="name_latin"
                value={editForm.name_latin || ""}
                onChange={(e) => setEditForm({ ...editForm, name_latin: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_khmer">Name (Khmer)</Label>
              <Input
                id="name_khmer"
                value={editForm.name_khmer || ""}
                onChange={(e) => setEditForm({ ...editForm, name_khmer: e.target.value })}
                className="font-khmer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="population">Population</Label>
              <Input
                id="population"
                type="number"
                value={editForm.population || ""}
                onChange={(e) => setEditForm({ ...editForm, population: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area (km²)</Label>
              <Input
                id="area"
                type="number"
                step="0.01"
                value={editForm.area || ""}
                onChange={(e) => setEditForm({ ...editForm, area: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={editForm.latitude || ""}
                onChange={(e) => setEditForm({ ...editForm, latitude: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={editForm.longitude || ""}
                onChange={(e) => setEditForm({ ...editForm, longitude: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editForm.description || ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
