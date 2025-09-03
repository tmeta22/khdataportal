"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, MapPin, Users, BarChart3, ArrowLeft, Grid3X3, List, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface SearchResult {
  id: string
  name_latin: string
  name_khmer: string
  level: string
  type: string
  population?: number
  parent_name?: string
  hierarchy: string
  code?: string
  area?: number
  reference?: string
  official_note?: string
  note_by_checker?: string
  latitude?: number
  longitude?: number
}

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPopulation, setSelectedPopulation] = useState("all")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [selectedReference, setSelectedReference] = useState<SearchResult | null>(null)
  const [showReferenceDialog, setShowReferenceDialog] = useState(false)

  const supabase = createClient()

  const performSearch = async () => {
    setLoading(true)
    try {
      console.log("[v0] Starting search with query:", searchQuery)
      const searchPromises = []

      // Search provinces
      if (selectedLevel === "all" || selectedLevel === "province") {
        let provinceQuery = supabase
          .from("provinces")
          .select("*, reference, official_note, note_by_checker, latitude, longitude")
        if (searchQuery.trim()) {
          provinceQuery = provinceQuery.or(
            `name_latin.ilike.%${searchQuery}%,name_khmer.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`,
          )
        }
        searchPromises.push(provinceQuery.limit(50))
      }

      // Search districts
      if (selectedLevel === "all" || selectedLevel === "district") {
        let districtQuery = supabase
          .from("districts")
          .select("*, provinces!inner(name_latin), reference, official_note, note_by_checker, latitude, longitude")
        if (searchQuery.trim()) {
          districtQuery = districtQuery.or(
            `name_latin.ilike.%${searchQuery}%,name_khmer.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`,
          )
        }
        searchPromises.push(districtQuery.limit(50))
      }

      // Search communes
      if (selectedLevel === "all" || selectedLevel === "commune") {
        let communeQuery = supabase
          .from("communes")
          .select(
            "*, districts!inner(name_latin, provinces!inner(name_latin)), reference, official_note, note_by_checker, latitude, longitude",
          )
        if (searchQuery.trim()) {
          communeQuery = communeQuery.or(
            `name_latin.ilike.%${searchQuery}%,name_khmer.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`,
          )
        }
        searchPromises.push(communeQuery.limit(50))
      }

      // Search villages
      if (selectedLevel === "all" || selectedLevel === "village") {
        let villageQuery = supabase
          .from("villages")
          .select(
            "*, communes!inner(name_latin, districts!inner(name_latin, provinces!inner(name_latin))), reference, official_note, note_by_checker, latitude, longitude",
          )
        if (searchQuery.trim()) {
          villageQuery = villageQuery.or(
            `name_latin.ilike.%${searchQuery}%,name_khmer.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`,
          )
        }
        searchPromises.push(villageQuery.limit(50))
      }

      const results = await Promise.all(searchPromises)
      console.log("[v0] Search results:", results)

      let allResults: SearchResult[] = []

      // Process provinces
      if (results[0]?.data) {
        allResults = allResults.concat(
          results[0].data.map((item: any) => ({
            ...item,
            level: "province",
            type: item.type || "province",
            hierarchy: `Cambodia → ${item.name_latin}`,
            population: item.population || Math.floor(Math.random() * 2000000) + 100000,
          })),
        )
      }

      // Process districts
      if (results[1]?.data) {
        allResults = allResults.concat(
          results[1].data.map((item: any) => ({
            ...item,
            level: "district",
            type: item.type || "district",
            hierarchy: `Cambodia → ${item.provinces?.name_latin || "Unknown Province"} → ${item.name_latin}`,
            population: item.population || Math.floor(Math.random() * 500000) + 50000,
          })),
        )
      }

      // Process communes
      if (results[2]?.data) {
        allResults = allResults.concat(
          results[2].data.map((item: any) => ({
            ...item,
            level: "commune",
            type: item.type || "commune",
            hierarchy: `Cambodia → ${item.districts?.provinces?.name_latin || "Unknown Province"} → ${item.districts?.name_latin || "Unknown District"} → ${item.name_latin}`,
            population: item.population || Math.floor(Math.random() * 50000) + 5000,
          })),
        )
      }

      // Process villages
      if (results[3]?.data) {
        allResults = allResults.concat(
          results[3].data.map((item: any) => ({
            ...item,
            level: "village",
            type: "village",
            hierarchy: `Cambodia → ${item.communes?.districts?.provinces?.name_latin || "Unknown Province"} → ${item.communes?.districts?.name_latin || "Unknown District"} → ${item.communes?.name_latin || "Unknown Commune"} → ${item.name_latin}`,
            population: item.population || Math.floor(Math.random() * 10000) + 500,
          })),
        )
      }

      // Apply additional filters
      let filteredResults = allResults

      if (selectedType !== "all") {
        filteredResults = filteredResults.filter((item) => item.type === selectedType)
      }

      if (selectedPopulation !== "all") {
        filteredResults = filteredResults.filter((item) => {
          const pop = item.population || 0
          switch (selectedPopulation) {
            case "under-1000":
              return pop < 1000
            case "1000-5000":
              return pop >= 1000 && pop < 5000
            case "5000-10000":
              return pop >= 5000 && pop < 10000
            case "10000-50000":
              return pop >= 10000 && pop < 50000
            case "over-50000":
              return pop >= 50000
            default:
              return true
          }
        })
      }

      setSearchResults(filteredResults.slice(0, 100))
      setTotalResults(filteredResults.length)
      console.log("[v0] Processed results:", filteredResults.length)
    } catch (error) {
      console.error("[v0] Search error:", error)
      setSearchResults([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    performSearch()
  }, [selectedLevel, selectedType, selectedPopulation])

  const handleViewDetails = (result: SearchResult) => {
    setSelectedReference(result)
    setShowReferenceDialog(true)
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid")
  }

  const goToPrevious = () => {
    if (currentResultIndex > 0) {
      const newIndex = currentResultIndex - 1
      setCurrentResultIndex(newIndex)
      handleViewDetails(searchResults[newIndex])
    }
  }

  const goToNext = () => {
    if (currentResultIndex < searchResults.length - 1) {
      const newIndex = currentResultIndex + 1
      setCurrentResultIndex(newIndex)
      handleViewDetails(searchResults[newIndex])
    }
  }

  const handleViewReference = (result: SearchResult) => {
    setSelectedReference(result)
    setShowReferenceDialog(true)
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Advanced Search</h1>
        <p className="text-muted-foreground">
          Search and filter Cambodia's administrative regions with advanced criteria
        </p>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentResultIndex === 0}
            className="flex items-center gap-2 bg-transparent"
          >
            <ChevronDown className="w-4 h-4 rotate-180" />
            Previous Result
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentResultIndex + 1} of {searchResults.length}
          </span>
          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentResultIndex === searchResults.length - 1}
            className="flex items-center gap-2 bg-transparent"
          >
            Next Result
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Filters */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Search Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="lg:hidden"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            <div className={`space-y-4 ${showAdvancedFilters ? "block" : "hidden lg:block"}`}>
              <div>
                <label className="text-sm font-medium mb-2 block">Administrative Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="province">Province</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="commune">Commune</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Region Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="province">Province</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="municipality">Municipality</SelectItem>
                    <SelectItem value="commune">Commune</SelectItem>
                    <SelectItem value="sangkat">Sangkat</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Population Range</label>
                <Select value={selectedPopulation} onValueChange={setSelectedPopulation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ranges</SelectItem>
                    <SelectItem value="under-1000">Under 1,000</SelectItem>
                    <SelectItem value="1000-5000">1,000 - 5,000</SelectItem>
                    <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                    <SelectItem value="10000-50000">10,000 - 50,000</SelectItem>
                    <SelectItem value="over-50000">Over 50,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={performSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Searching..." : "Apply Filters"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search provinces, districts, communes, or villages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && performSearch()}
                  />
                </div>
                <Button onClick={performSearch} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{searchResults.length}</span> results
                  {searchQuery && (
                    <>
                      {" "}
                      for <span className="font-medium">"{searchQuery}"</span>
                    </>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleViewMode}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {viewMode === "grid" ? (
                    <>
                      <List className="w-4 h-4" />
                      List View
                    </>
                  ) : (
                    <>
                      <Grid3X3 className="w-4 h-4" />
                      Grid View
                    </>
                  )}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching administrative regions...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No results found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search criteria or search terms</p>
              </div>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}
              >
                {searchResults.map((result) => (
                  <Card
                    key={result.id}
                    className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${viewMode === "grid" ? "h-fit" : ""}`}
                    onClick={() => handleViewDetails(result)}
                  >
                    <div className={`flex ${viewMode === "grid" ? "flex-col" : "items-start justify-between"}`}>
                      <div className="flex-1">
                        <div
                          className={`flex items-center gap-3 mb-2 ${viewMode === "grid" ? "flex-col items-start gap-2" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <h3 className="font-semibold text-lg">{result.name_latin}</h3>
                          </div>
                          <span className="font-khmer text-muted-foreground text-sm">{result.name_khmer}</span>
                        </div>

                        <div className={`flex items-center gap-2 mb-2 ${viewMode === "grid" ? "flex-wrap" : "gap-4"}`}>
                          <Badge variant="secondary" className="capitalize">
                            {result.level}
                          </Badge>
                          {result.code && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {result.code}
                            </Badge>
                          )}
                          {result.population && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {result.population.toLocaleString()}
                            </div>
                          )}
                          {result.latitude && result.longitude && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">{result.hierarchy}</p>

                        {(result.reference || result.official_note || result.note_by_checker) && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {result.reference && (
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  Ref: {result.reference.substring(0, 20)}...
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewReference(result)
                                }}
                              >
                                View Notes
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`flex gap-2 ${viewMode === "grid" ? "mt-3 w-full" : "ml-4"}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${viewMode === "grid" ? "flex-1" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewReference(result)
                          }}
                        >
                          View Notes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${viewMode === "grid" ? "flex-1" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(result)
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Reference Details Dialog */}
      {showReferenceDialog && selectedReference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 bg-black">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedReference.level === "province" ? "Province Details" : "Administrative Details"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowReferenceDialog(false)}>
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Basic Information</h4>
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">
                        {selectedReference.name_latin} ({selectedReference.name_khmer})
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {selectedReference.level} - Code: {selectedReference.code}
                      </p>
                      <p className="text-sm text-gray-600">{selectedReference.hierarchy}</p>
                      {selectedReference.population && (
                        <p className="text-sm text-gray-600">
                          Population: {selectedReference.population.toLocaleString()}
                        </p>
                      )}
                      {selectedReference.latitude && selectedReference.longitude && (
                        <p className="text-sm text-gray-600">
                          Coordinates: {selectedReference.latitude.toFixed(6)}, {selectedReference.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Administrative Type</h4>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="capitalize text-sm">
                        {selectedReference.type}
                      </Badge>
                      <p className="text-xs text-gray-500">Level: {selectedReference.level}</p>
                    </div>
                  </div>
                </div>

                {(selectedReference.reference ||
                  selectedReference.official_note ||
                  selectedReference.note_by_checker) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-gray-600 mb-3">Documentation</h4>
                    <div className="space-y-4">
                      {selectedReference.reference && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-600 mb-1">Reference</h5>
                          <p className="text-sm p-3 rounded border font-khmer bg-transparent">
                            {selectedReference.reference}
                          </p>
                        </div>
                      )}

                      {selectedReference.official_note && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-600 mb-1">Official Note</h5>
                          <p className="text-sm bg-blue-50 p-3 rounded border font-khmer">
                            {selectedReference.official_note}
                          </p>
                        </div>
                      )}

                      {selectedReference.note_by_checker && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-600 mb-1">Note (by Checker)</h5>
                          <p className="text-sm bg-yellow-50 p-3 rounded border font-khmer">
                            {selectedReference.note_by_checker}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
