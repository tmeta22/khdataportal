"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Trash2, Search, Loader2, MapPin, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BoundaryRecord {
  id: string
  admin_code: string
  admin_name: string
  admin_level: string
  geometry: any
  properties: any
  created_at: string
}

export function BoundaryDetailsTable() {
  const [boundaries, setBoundaries] = useState<BoundaryRecord[]>([])
  const [filteredBoundaries, setFilteredBoundaries] = useState<BoundaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [selectedBoundaries, setSelectedBoundaries] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadBoundaries = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load from all boundary tables
      const [provincesResult, districtsResult, communesResult] = await Promise.all([
        supabase.from("province_boundaries").select("*"),
        supabase.from("district_boundaries").select("*"),
        supabase.from("commune_boundaries").select("*"),
      ])

      const allBoundaries: BoundaryRecord[] = []

      // Add provinces
      if (provincesResult.data) {
        allBoundaries.push(
          ...provincesResult.data.map((item) => ({
            ...item,
            admin_level: "Province",
          })),
        )
      }

      // Add districts
      if (districtsResult.data) {
        allBoundaries.push(
          ...districtsResult.data.map((item) => ({
            ...item,
            admin_level: "District",
          })),
        )
      }

      // Add communes
      if (communesResult.data) {
        allBoundaries.push(
          ...communesResult.data.map((item) => ({
            ...item,
            admin_level: "Commune",
          })),
        )
      }

      // Sort by admin_level and name
      allBoundaries.sort((a, b) => {
        const levelOrder = { Province: 1, District: 2, Commune: 3 }
        const levelDiff =
          levelOrder[a.admin_level as keyof typeof levelOrder] - levelOrder[b.admin_level as keyof typeof levelOrder]
        if (levelDiff !== 0) return levelDiff
        return a.admin_name.localeCompare(b.admin_name)
      })

      setBoundaries(allBoundaries)
      setFilteredBoundaries(allBoundaries)

      console.log("[v0] Loaded boundaries:", allBoundaries.length)
    } catch (error) {
      console.error("[v0] Error loading boundaries:", error)
      setError("Failed to load boundary data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoundaries()
  }, [])

  useEffect(() => {
    let filtered = boundaries

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (boundary) =>
          boundary.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          boundary.admin_code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by level
    if (levelFilter !== "all") {
      filtered = filtered.filter((boundary) => boundary.admin_level === levelFilter)
    }

    setFilteredBoundaries(filtered)
  }, [boundaries, searchTerm, levelFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBoundaries(new Set(filteredBoundaries.map((b) => b.id)))
    } else {
      setSelectedBoundaries(new Set())
    }
  }

  const handleSelectBoundary = (boundaryId: string, checked: boolean) => {
    const newSelected = new Set(selectedBoundaries)
    if (checked) {
      newSelected.add(boundaryId)
    } else {
      newSelected.delete(boundaryId)
    }
    setSelectedBoundaries(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedBoundaries.size === 0) return

    setIsDeleting(true)
    try {
      const selectedIds = Array.from(selectedBoundaries)

      // Group by admin level for deletion
      const toDelete = {
        provinces: selectedIds.filter((id) => boundaries.find((b) => b.id === id)?.admin_level === "Province"),
        districts: selectedIds.filter((id) => boundaries.find((b) => b.id === id)?.admin_level === "District"),
        communes: selectedIds.filter((id) => boundaries.find((b) => b.id === id)?.admin_level === "Commune"),
      }

      // Delete from respective tables
      const deletePromises = []

      if (toDelete.provinces.length > 0) {
        deletePromises.push(supabase.from("province_boundaries").delete().in("id", toDelete.provinces))
      }
      if (toDelete.districts.length > 0) {
        deletePromises.push(supabase.from("district_boundaries").delete().in("id", toDelete.districts))
      }
      if (toDelete.communes.length > 0) {
        deletePromises.push(supabase.from("commune_boundaries").delete().in("id", toDelete.communes))
      }

      await Promise.all(deletePromises)

      setSelectedBoundaries(new Set())
      await loadBoundaries()

      console.log("[v0] Deleted boundaries:", selectedIds.length)
    } catch (error) {
      console.error("[v0] Error deleting boundaries:", error)
      setError("Failed to delete selected boundaries")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportSelected = () => {
    const selectedData = boundaries.filter((b) => selectedBoundaries.has(b.id))
    const csvContent = [
      ["Admin Code", "Admin Name", "Admin Level", "Created At"].join(","),
      ...selectedData.map((boundary) =>
        [
          boundary.admin_code,
          `"${boundary.admin_name}"`,
          boundary.admin_level,
          new Date(boundary.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `boundary-details-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Province":
        return "bg-blue-100 text-blue-800"
      case "District":
        return "bg-orange-100 text-orange-800"
      case "Commune":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading boundary details...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Boundary Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search boundaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Province">Provinces</SelectItem>
                <SelectItem value="District">Districts</SelectItem>
                <SelectItem value="Commune">Communes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSelected} disabled={selectedBoundaries.size === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedBoundaries.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedBoundaries.size === 0 || isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Selected ({selectedBoundaries.size})
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredBoundaries.length} of {boundaries.length} boundaries
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBoundaries.size === filteredBoundaries.length && filteredBoundaries.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Admin Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Geometry Type</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBoundaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No boundary data found. Import GeoJSON files to see boundaries here.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBoundaries.map((boundary) => (
                  <TableRow key={boundary.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBoundaries.has(boundary.id)}
                        onCheckedChange={(checked) => handleSelectBoundary(boundary.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{boundary.admin_code}</TableCell>
                    <TableCell className="font-medium">{boundary.admin_name}</TableCell>
                    <TableCell>
                      <Badge className={getLevelColor(boundary.admin_level)}>{boundary.admin_level}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {boundary.geometry?.type || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(boundary.created_at).toLocaleDateString()}
                    </TableCell>
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

export default BoundaryDetailsTable
