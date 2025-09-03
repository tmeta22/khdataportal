"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Edit, Trash2, Search, Download, Trash } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CoordinateRecord {
  id: string
  code: string
  name_latin: string
  name_khmer: string
  type: string
  latitude: number | null
  longitude: number | null
  updated_at: string
}

export function CoordinateDetailsTable() {
  const [coordinates, setCoordinates] = useState<CoordinateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<CoordinateRecord | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [editForm, setEditForm] = useState({
    latitude: "",
    longitude: "",
  })

  const supabase = createClient()

  const loadCoordinates = async () => {
    setLoading(true)
    try {
      const [provincesRes, districtsRes, communesRes, villagesRes] = await Promise.all([
        supabase
          .from("provinces")
          .select("id, code, name_latin, name_khmer, latitude, longitude, updated_at")
          .order("name_latin"),
        supabase
          .from("districts")
          .select("id, code, name_latin, name_khmer, latitude, longitude, updated_at")
          .order("name_latin"),
        supabase
          .from("communes")
          .select("id, code, name_latin, name_khmer, latitude, longitude, updated_at")
          .order("name_latin"),
        supabase
          .from("villages")
          .select("id, code, name_latin, name_khmer, latitude, longitude, updated_at")
          .order("name_latin"),
      ])

      const allCoordinates: CoordinateRecord[] = [
        ...(provincesRes.data || []).map((item) => ({ ...item, type: "Province" })),
        ...(districtsRes.data || []).map((item) => ({ ...item, type: "District" })),
        ...(communesRes.data || []).map((item) => ({ ...item, type: "Commune" })),
        ...(villagesRes.data || []).map((item) => ({ ...item, type: "Village" })),
      ]

      setCoordinates(allCoordinates)
    } catch (error) {
      console.error("[v0] Error loading coordinates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoordinates()
  }, [])

  const handleEdit = (record: CoordinateRecord) => {
    setEditingRecord(record)
    setEditForm({
      latitude: record.latitude?.toString() || "",
      longitude: record.longitude?.toString() || "",
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return

    try {
      const tableName = editingRecord.type.toLowerCase() + "s"
      const { error } = await supabase
        .from(tableName)
        .update({
          latitude: Number.parseFloat(editForm.latitude) || null,
          longitude: Number.parseFloat(editForm.longitude) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRecord.id)

      if (error) {
        console.error("[v0] Error updating coordinates:", error)
        alert("Error updating coordinates")
      } else {
        alert("Coordinates updated successfully!")
        setShowEditDialog(false)
        loadCoordinates()
      }
    } catch (error) {
      console.error("[v0] Error saving coordinates:", error)
      alert("Error saving coordinates")
    }
  }

  const handleDelete = async (record: CoordinateRecord) => {
    if (!confirm(`Are you sure you want to delete coordinates for ${record.name_latin}?`)) return

    try {
      const tableName = record.type.toLowerCase() + "s"
      const { error } = await supabase
        .from(tableName)
        .update({
          latitude: null,
          longitude: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id)

      if (error) {
        console.error("[v0] Error deleting coordinates:", error)
        alert("Error deleting coordinates")
      } else {
        alert("Coordinates deleted successfully!")
        loadCoordinates()
      }
    } catch (error) {
      console.error("[v0] Error deleting coordinates:", error)
      alert("Error deleting coordinates")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const allIds = filteredCoordinates.map((record) => `${record.type}-${record.id}`)
      setSelectedRecords(new Set(allIds))
    } else {
      setSelectedRecords(new Set())
    }
  }

  const handleSelectRecord = (recordKey: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords)
    if (checked) {
      newSelected.add(recordKey)
    } else {
      newSelected.delete(recordKey)
    }
    setSelectedRecords(newSelected)
    setSelectAll(newSelected.size === filteredCoordinates.length)
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return

    if (!confirm(`Are you sure you want to delete coordinates for ${selectedRecords.size} selected records?`)) return

    try {
      const deletePromises = Array.from(selectedRecords).map(async (recordKey) => {
        const record = coordinates.find((r) => `${r.type}-${r.id}` === recordKey)
        if (!record) return

        const tableName = record.type.toLowerCase() + "s"
        return supabase
          .from(tableName)
          .update({
            latitude: null,
            longitude: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", record.id)
      })

      await Promise.all(deletePromises)
      alert(`Successfully deleted coordinates for ${selectedRecords.size} records!`)
      setSelectedRecords(new Set())
      setSelectAll(false)
      loadCoordinates()
    } catch (error) {
      console.error("[v0] Error bulk deleting coordinates:", error)
      alert("Error deleting coordinates")
    }
  }

  const handleExport = () => {
    const exportData = filteredCoordinates.map((record) => ({
      Code: record.code,
      "Name (Latin)": record.name_latin,
      "Name (Khmer)": record.name_khmer,
      Type: record.type,
      Latitude: record.latitude || "",
      Longitude: record.longitude || "",
      "Has Coordinates": record.latitude && record.longitude ? "Yes" : "No",
      "Updated At": record.updated_at,
    }))

    const csvContent = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `coordinate-details-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSelected = () => {
    if (selectedRecords.size === 0) {
      alert("Please select records to export")
      return
    }

    const selectedData = Array.from(selectedRecords)
      .map((recordKey) => coordinates.find((r) => `${r.type}-${r.id}` === recordKey))
      .filter(Boolean)
      .map((record) => ({
        Code: record!.code,
        "Name (Latin)": record!.name_latin,
        "Name (Khmer)": record!.name_khmer,
        Type: record!.type,
        Latitude: record!.latitude || "",
        Longitude: record!.longitude || "",
        "Has Coordinates": record!.latitude && record!.longitude ? "Yes" : "No",
        "Updated At": record!.updated_at,
      }))

    const csvContent = [
      Object.keys(selectedData[0] || {}).join(","),
      ...selectedData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `selected-coordinates-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCoordinates = coordinates.filter((record) => {
    const matchesSearch =
      record.name_latin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.name_khmer.includes(searchTerm) ||
      record.code.includes(searchTerm)
    const matchesType = typeFilter === "all" || record.type.toLowerCase() === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const coordinatesWithData = filteredCoordinates.filter((record) => record.latitude && record.longitude)
  const coordinatesWithoutData = filteredCoordinates.filter((record) => !record.latitude || !record.longitude)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Coordinate Details</span>
            <Badge variant="secondary">{coordinatesWithData.length} with coordinates</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {selectedRecords.size > 0 && (
              <>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRecords.size})
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSelected}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected ({selectedRecords.size})
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            <Button onClick={loadCoordinates} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="type-filter">Type Filter</Label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="province">Province</option>
              <option value="district">District</option>
              <option value="commune">Commune</option>
              <option value="village">Village</option>
            </select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="Select all" />
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name (Latin)</TableHead>
                <TableHead>Name (Khmer)</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoordinates.map((record) => {
                const recordKey = `${record.type}-${record.id}`
                return (
                  <TableRow key={recordKey}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRecords.has(recordKey)}
                        onCheckedChange={(checked) => handleSelectRecord(recordKey, checked as boolean)}
                        aria-label={`Select ${record.name_latin}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{record.code}</TableCell>
                    <TableCell className="font-medium">{record.name_latin}</TableCell>
                    <TableCell className="font-khmer">{record.name_khmer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.latitude ? record.latitude.toFixed(6) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.longitude ? record.longitude.toFixed(6) : "—"}
                    </TableCell>
                    <TableCell>
                      {record.latitude && record.longitude ? (
                        <Badge className="bg-green-100 text-green-800">Has Coordinates</Badge>
                      ) : (
                        <Badge variant="secondary">No Coordinates</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {record.latitude && record.longitude && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(record)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {filteredCoordinates.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">No coordinates found matching your criteria.</div>
        )}
      </CardContent>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coordinates</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div>
                <Label>Location</Label>
                <p className="text-sm text-muted-foreground">
                  {editingRecord.name_latin} ({editingRecord.name_khmer}) - {editingRecord.type}
                </p>
              </div>
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  placeholder="e.g., 13.7467"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  placeholder="e.g., 102.97"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
