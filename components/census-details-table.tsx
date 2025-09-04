"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Trash2, Users, BarChart3 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface CensusDetailsTableProps {
  onDataChange?: () => void
}

export function CensusDetailsTable({ onDataChange }: CensusDetailsTableProps) {
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadCensusData()
  }, [])

  useEffect(() => {
    filterData()
  }, [data, searchQuery, selectedYear])

  const loadCensusData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading census data...")

      const { data: censusData, error } = await supabase
        .from("census_data")
        .select("*")
        .order("year", { ascending: false })
        .order("provinces")

      if (error) {
        console.error("[v0] Error loading census data:", error)
        return
      }

      setData(censusData || [])

      // Extract available years
      const years = [...new Set((censusData || []).map((item) => item.year))].sort((a, b) => b - a)
      setAvailableYears(years)

      console.log("[v0] Census data loaded:", censusData?.length, "records")
    } catch (error) {
      console.error("[v0] Error loading census data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = data

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.provinces?.toLowerCase().includes(query) ||
          item.provinces_kh?.toLowerCase().includes(query) ||
          item.pro_code?.toLowerCase().includes(query),
      )
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((item) => item.year === Number.parseInt(selectedYear))
    }

    setFilteredData(filtered)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredData.map((item) => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    try {
      console.log("[v0] Deleting", selectedItems.size, "census records...")

      const { error } = await supabase.from("census_data").delete().in("id", Array.from(selectedItems))

      if (error) {
        console.error("[v0] Error deleting census data:", error)
        return
      }

      console.log("[v0] Successfully deleted census records")
      setSelectedItems(new Set())
      loadCensusData()
      onDataChange?.()
    } catch (error) {
      console.error("[v0] Error deleting census data:", error)
    }
  }

  const exportSelected = () => {
    const dataToExport =
      selectedItems.size > 0 ? filteredData.filter((item) => selectedItems.has(item.id)) : filteredData

    const csvContent = [
      // Headers
      [
        "Year",
        "Province Code",
        "Province (English)",
        "Province (Khmer)",
        "Households",
        "Males",
        "Females",
        "Total",
        "Household Size",
        "Area (km²)",
        "Population Density",
      ].join(","),
      // Data rows
      ...dataToExport.map((item) =>
        [
          item.year,
          item.pro_code,
          item.provinces,
          item.provinces_kh || "",
          item.households || 0,
          item.males || 0,
          item.females || 0,
          item.total || 0,
          item.household_size || 0,
          item.area_km2 || 0,
          item.pop_km2 || 0,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `census_data_export_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Census Data Details
        </CardTitle>
        <CardDescription>View, search, and manage imported census data with demographic statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search provinces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={exportSelected} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export {selectedItems.size > 0 ? `(${selectedItems.size})` : "All"}
            </Button>
            {selectedItems.size > 0 && (
              <Button onClick={handleBulkDelete} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedItems.size})
              </Button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="flex flex-wrap gap-4">
          <Badge variant="secondary">
            <BarChart3 className="h-3 w-3 mr-1" />
            {filteredData.length} records
          </Badge>
          {selectedYear !== "all" && <Badge variant="outline">Year: {selectedYear}</Badge>}
          {selectedItems.size > 0 && <Badge variant="destructive">{selectedItems.size} selected</Badge>}
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.size === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Households</TableHead>
                <TableHead>Males</TableHead>
                <TableHead>Females</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Household Size</TableHead>
                <TableHead>Area (km²)</TableHead>
                <TableHead>Density</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Loading census data...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No census data found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.year}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.pro_code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.provinces}</div>
                        {item.provinces_kh && <div className="text-sm text-muted-foreground">{item.provinces_kh}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{item.households?.toLocaleString() || "—"}</TableCell>
                    <TableCell>{item.males?.toLocaleString() || "—"}</TableCell>
                    <TableCell>{item.females?.toLocaleString() || "—"}</TableCell>
                    <TableCell className="font-medium">{item.total?.toLocaleString() || "—"}</TableCell>
                    <TableCell>{item.household_size || "—"}</TableCell>
                    <TableCell>{item.area_km2?.toLocaleString() || "—"}</TableCell>
                    <TableCell>{item.pop_km2?.toLocaleString() || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
