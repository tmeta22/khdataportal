"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Plus, Search, Filter, ChevronUp, ChevronDown, Eye, Edit2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"

interface AdminRecord {
  id: string
  code: string
  name_khmer: string
  name_latin: string
  type: "province" | "district" | "commune" | "village" | "municipality" | "khan" | "sangkat"
  parent_id?: string
  parent_name?: string
  created_at: string
  updated_at: string
  reference?: string
  official_note?: string
  note_by_checker?: string
}

interface DataTableProps {
  selectedLevel?: string
  selectedParent?: string
}

export function DataTable({ selectedLevel = "all", selectedParent }: DataTableProps) {
  const [data, setData] = useState<AdminRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("province")
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<AdminRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name_khmer: "",
    name_latin: "",
    type: "province" as const,
    parent_id: "",
    reference: "",
    official_note: "",
    note_by_checker: "",
  })
  const [bulkEditData, setBulkEditData] = useState({
    type: "keep-current",
    reference: "",
    official_note: "",
    note_by_checker: "",
  })

  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        console.log("[v0] Loading administrative data...")

        const queries = await Promise.all([
          supabase
            .from("provinces")
            .select(
              "id, code, name_khmer, name_latin, type, created_at, updated_at, reference, official_note, note_by_checker",
            ),
          supabase.from("districts").select(`
            id, code, name_khmer, name_latin, type, created_at, updated_at, reference, official_note, note_by_checker,
            provinces!inner(id, name_latin)
          `),
          supabase.from("municipalities").select(`
            id, code, name_khmer, name_latin, type, created_at, updated_at, reference, official_note, note_by_checker,
            provinces!inner(id, name_latin)
          `),
          supabase.from("khan").select(`
            id, code, name_khmer, name_latin, type, created_at, updated_at, reference, official_note, note_by_checker,
            provinces!inner(id, name_latin)
          `),
          supabase.from("communes").select(`
            id, code, name_khmer, name_latin, type, created_at, updated_at, reference, official_note, note_by_checker,
            districts!inner(id, name_latin, provinces!inner(name_latin))
          `),
          supabase.from("sangkat").select(`
            id, code, name_khmer, name_latin, type, created_at, updated_at, reference, official_note, note_by_checker,
            khan!inner(id, name_latin, provinces!inner(name_latin))
          `),
          supabase.from("villages").select(`
            id, code, name_khmer, name_latin, created_at, updated_at, reference, official_note, note_by_checker,
            communes!inner(id, name_latin, districts!inner(name_latin))
          `),
        ])

        const [provinces, districts, municipalities, khan, communes, sangkat, villages] = queries

        const allRecords: AdminRecord[] = [
          ...(provinces.data || []).map((p: any) => ({
            ...p,
            type: p.type || "province",
            parent_name: "Cambodia",
          })),
          ...(districts.data || []).map((d: any) => ({
            ...d,
            type: d.type || "district",
            parent_id: d.provinces?.id,
            parent_name: d.provinces?.name_latin,
          })),
          ...(municipalities.data || []).map((m: any) => ({
            ...m,
            type: m.type || "municipality",
            parent_id: m.provinces?.id,
            parent_name: m.provinces?.name_latin,
          })),
          ...(khan.data || []).map((k: any) => ({
            ...k,
            type: k.type || "khan",
            parent_id: k.provinces?.id,
            parent_name: k.provinces?.name_latin,
          })),
          ...(communes.data || []).map((c: any) => ({
            ...c,
            type: c.type || "commune",
            parent_id: c.districts?.id,
            parent_name: `${c.districts?.name_latin}, ${c.districts?.provinces?.name_latin}`,
          })),
          ...(sangkat.data || []).map((s: any) => ({
            ...s,
            type: s.type || "sangkat",
            parent_id: s.khan?.id,
            parent_name: `${s.khan?.name_latin}, ${s.khan?.provinces?.name_latin}`,
          })),
          ...(villages.data || []).map((v: any) => ({
            ...v,
            type: "village" as const,
            parent_id: v.communes?.id,
            parent_name: `${v.communes?.name_latin}, ${v.communes?.districts?.name_latin}`,
          })),
        ]

        console.log("[v0] Loaded records:", allRecords.length)
        setData(allRecords)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const filteredData = data.filter((record) => {
    const matchesSearch =
      record.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.name_khmer.includes(searchQuery) ||
      record.code.includes(searchQuery)

    const matchesType = filterType === "all" || record.type === filterType
    const matchesLevel = selectedLevel === "all" || record.type === selectedLevel

    return matchesSearch && matchesType && matchesLevel
  })

  const handleBulkEdit = async () => {
    if (selectedRecords.size === 0) return

    try {
      console.log("[v0] Bulk editing records:", Array.from(selectedRecords))

      const recordsByTable = new Map<string, { ids: string[]; updates: any }>()

      selectedRecords.forEach((recordId) => {
        const record = data.find((r) => r.id === recordId)
        if (record) {
          const tableName = getTableName(record.type)
          if (!recordsByTable.has(tableName)) {
            recordsByTable.set(tableName, { ids: [], updates: {} })
          }
          recordsByTable.get(tableName)!.ids.push(recordId)
        }
      })

      const updates: any = {}
      if (bulkEditData.type && bulkEditData.type !== "keep-current") updates.type = bulkEditData.type
      if (bulkEditData.reference) updates.reference = bulkEditData.reference
      if (bulkEditData.official_note) updates.official_note = bulkEditData.official_note
      if (bulkEditData.note_by_checker) updates.note_by_checker = bulkEditData.note_by_checker

      for (const [tableName, { ids }] of recordsByTable) {
        const { error } = await supabase.from(tableName).update(updates).in("id", ids)
        if (error) {
          console.error(`[v0] Error bulk editing ${tableName}:`, error)
          throw error
        }
      }

      console.log("[v0] Successfully bulk edited", selectedRecords.size, "records")
      setIsBulkEditOpen(false)
      setBulkEditData({ type: "keep-current", reference: "", official_note: "", note_by_checker: "" })
      setSelectedRecords(new Set())
      window.location.reload()
    } catch (error) {
      console.error("[v0] Bulk edit error:", error)
      alert(`Error editing records: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return

    if (
      !confirm(
        `Are you sure you want to delete ${selectedRecords.size} selected records? This action cannot be undone.`,
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      console.log("[v0] Bulk deleting records:", Array.from(selectedRecords))

      const recordsByType = new Map<string, string[]>()

      selectedRecords.forEach((recordId) => {
        const record = data.find((r) => r.id === recordId)
        if (record) {
          const tableName = `${record.type}s`
          if (!recordsByType.has(tableName)) {
            recordsByType.set(tableName, [])
          }
          recordsByType.get(tableName)!.push(recordId)
        }
      })

      for (const [tableName, ids] of recordsByType) {
        const { error } = await supabase.from(tableName).delete().in("id", ids)
        if (error) {
          console.error(`[v0] Error deleting from ${tableName}:`, error)
          throw error
        }
      }

      console.log("[v0] Successfully deleted", selectedRecords.size, "records")

      setData(data.filter((record) => !selectedRecords.has(record.id)))
      setSelectedRecords(new Set())
    } catch (error) {
      console.error("[v0] Bulk delete error:", error)
      alert(`Error deleting records: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(filteredData.map((record) => record.id)))
    } else {
      setSelectedRecords(new Set())
    }
  }

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords)
    if (checked) {
      newSelected.add(recordId)
    } else {
      newSelected.delete(recordId)
    }
    setSelectedRecords(newSelected)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }

  const handleSave = async () => {
    try {
      console.log("[v0] Attempting to save record:", formData)

      const tableName = getTableName(formData.type)
      const recordData = {
        code: formData.code,
        name_khmer: formData.name_khmer,
        name_latin: formData.name_latin,
        type: formData.type,
        reference: formData.reference,
        official_note: formData.official_note,
        note_by_checker: formData.note_by_checker,
        ...(formData.parent_id && { [`${getParentField(formData.type)}`]: formData.parent_id }),
      }

      console.log("[v0] Saving to table:", tableName, "with data:", recordData)

      if (editingRecord) {
        const { data, error } = await supabase.from(tableName).update(recordData).eq("id", editingRecord.id).select()

        if (error) {
          console.error("[v0] Update error:", error)
          throw error
        }
        console.log("[v0] Updated record:", editingRecord.id, data)
      } else {
        const { data, error } = await supabase.from(tableName).insert(recordData).select()

        if (error) {
          console.error("[v0] Insert error:", error)
          throw error
        }
        console.log("[v0] Created new record:", data)
      }

      setIsDialogOpen(false)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Save error:", error)
      alert(`Error saving record: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleDelete = async (record: AdminRecord) => {
    if (!confirm(`Are you sure you want to delete ${record.name_latin}?`)) return

    try {
      console.log("[v0] Attempting to delete record:", record.id)

      const tableName = getTableName(record.type)
      const { error } = await supabase.from(tableName).delete().eq("id", record.id)

      if (error) {
        console.error("[v0] Delete error:", error)
        throw error
      }

      console.log("[v0] Deleted record:", record.id)
      setData(data.filter((d) => d.id !== record.id))
    } catch (error) {
      console.error("[v0] Delete error:", error)
      alert(`Error deleting record: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleViewRecord = (record: AdminRecord) => {
    setViewingRecord(record)
    setIsViewDialogOpen(true)
  }

  const getTableName = (type: string) => {
    switch (type) {
      case "province":
        return "provinces"
      case "district":
        return "districts"
      case "municipality":
        return "municipalities"
      case "khan":
        return "khan"
      case "commune":
        return "communes"
      case "sangkat":
        return "sangkat"
      case "village":
        return "villages"
      default:
        return "provinces"
    }
  }

  const getParentField = (type: string) => {
    switch (type) {
      case "district":
      case "municipality":
      case "khan":
        return "province_id"
      case "commune":
        return "district_id"
      case "sangkat":
        return "khan_id"
      case "village":
        return "commune_id"
      default:
        return ""
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "province":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "district":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "municipality":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
      case "khan":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      case "commune":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "sangkat":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "village":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const openEditDialog = (record?: AdminRecord) => {
    if (record) {
      setEditingRecord(record)
      setFormData({
        code: record.code,
        name_khmer: record.name_khmer,
        name_latin: record.name_latin,
        type: record.type,
        parent_id: record.parent_id || "",
        reference: record.reference || "",
        official_note: record.official_note || "",
        note_by_checker: record.note_by_checker || "",
      })
    } else {
      setEditingRecord(null)
      setFormData({
        code: "",
        name_khmer: "",
        name_latin: "",
        type: "province",
        parent_id: "",
        reference: "",
        official_note: "",
        note_by_checker: "",
      })
    }
    setIsDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Administrative Data Management</CardTitle>
          <div className="flex gap-2">
            {selectedRecords.size > 0 && (
              <>
                <Button variant="outline" onClick={() => setIsBulkEditOpen(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Selected ({selectedRecords.size})
                </Button>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRecords.size})
                </Button>
              </>
            )}
            <Button onClick={() => openEditDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="province">Provinces</SelectItem>
              <SelectItem value="district">Districts</SelectItem>
              <SelectItem value="municipality">Municipalities</SelectItem>
              <SelectItem value="khan">Khan</SelectItem>
              <SelectItem value="commune">Communes</SelectItem>
              <SelectItem value="sangkat">Sangkat</SelectItem>
              <SelectItem value="village">Villages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading administrative data...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredData.length > 0 && selectedRecords.size === filteredData.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name (Khmer)</TableHead>
                    <TableHead>Name (Latin)</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.has(record.id)}
                          onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                          aria-label={`Select ${record.name_latin}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getTypeColor(record.type)}>
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{record.code}</TableCell>
                      <TableCell className="font-khmer">{record.name_khmer}</TableCell>
                      <TableCell>{record.name_latin}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.parent_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(record.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRecord(record)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(record)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(record)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {filteredData.length} of {data.length} records
              {selectedRecords.size > 0 && ` • ${selectedRecords.size} selected`}
            </div>
          </>
        )}

        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Edit Selected Records ({selectedRecords.size})</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-type">Change Type (optional)</Label>
                <Select
                  value={bulkEditData.type}
                  onValueChange={(value) => setBulkEditData({ ...bulkEditData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new type (leave empty to keep current)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep-current">Keep current type</SelectItem>
                    <SelectItem value="province">Province</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="municipality">Municipality</SelectItem>
                    <SelectItem value="khan">Khan</SelectItem>
                    <SelectItem value="commune">Commune</SelectItem>
                    <SelectItem value="sangkat">Sangkat</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bulk-reference">Reference (optional)</Label>
                <Textarea
                  id="bulk-reference"
                  value={bulkEditData.reference}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, reference: e.target.value })}
                  placeholder="Update reference for all selected records"
                  className="font-khmer"
                />
              </div>
              <div>
                <Label htmlFor="bulk-official-note">Official Note (optional)</Label>
                <Textarea
                  id="bulk-official-note"
                  value={bulkEditData.official_note}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, official_note: e.target.value })}
                  placeholder="Update official note for all selected records"
                  className="font-khmer"
                />
              </div>
              <div>
                <Label htmlFor="bulk-note-checker">Note by Checker (optional)</Label>
                <Textarea
                  id="bulk-note-checker"
                  value={bulkEditData.note_by_checker}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, note_by_checker: e.target.value })}
                  placeholder="Update checker note for all selected records"
                  className="font-khmer"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBulkEdit} className="flex-1">
                  Update Selected Records
                </Button>
                <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="shadow-lg bg-transparent"
            title="Go to top"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
            className="shadow-lg bg-transparent"
            title="Go to bottom"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Details</DialogTitle>
            </DialogHeader>
            {viewingRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <Badge variant="secondary" className={`${getTypeColor(viewingRecord.type)} mt-1`}>
                      {viewingRecord.type}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Code</Label>
                    <p className="font-mono text-sm mt-1">{viewingRecord.code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name (Latin)</Label>
                    <p className="text-sm mt-1">{viewingRecord.name_latin}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name (Khmer)</Label>
                    <p className="text-sm mt-1 font-khmer">{viewingRecord.name_khmer}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Parent</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{viewingRecord.parent_name}</p>
                  </div>
                </div>

                {(viewingRecord.reference || viewingRecord.official_note || viewingRecord.note_by_checker) && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-600 mb-3 block">Documentation</Label>
                    <div className="space-y-3">
                      {viewingRecord.reference && (
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Reference</Label>
                          <p className="text-sm bg-gray-50 p-2 rounded border font-khmer">{viewingRecord.reference}</p>
                        </div>
                      )}
                      {viewingRecord.official_note && (
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Official Note</Label>
                          <p className="text-sm bg-blue-50 p-2 rounded border font-khmer">
                            {viewingRecord.official_note}
                          </p>
                        </div>
                      )}
                      {viewingRecord.note_by_checker && (
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Note (by Checker)</Label>
                          <p className="text-sm bg-yellow-50 p-2 rounded border font-khmer">
                            {viewingRecord.note_by_checker}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Created</Label>
                      <p>{new Date(viewingRecord.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Updated</Label>
                      <p>{new Date(viewingRecord.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Record" : "Add New Record"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="province">Province</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="municipality">Municipality</SelectItem>
                    <SelectItem value="khan">Khan</SelectItem>
                    <SelectItem value="commune">Commune</SelectItem>
                    <SelectItem value="sangkat">Sangkat</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Administrative code"
                />
              </div>
              <div>
                <Label htmlFor="name_latin">Name (Latin)</Label>
                <Input
                  id="name_latin"
                  value={formData.name_latin}
                  onChange={(e) => setFormData({ ...formData, name_latin: e.target.value })}
                  placeholder="Name in Latin script"
                />
              </div>
              <div>
                <Label htmlFor="name_khmer">Name (Khmer)</Label>
                <Input
                  id="name_khmer"
                  value={formData.name_khmer}
                  onChange={(e) => setFormData({ ...formData, name_khmer: e.target.value })}
                  placeholder="Name in Khmer script"
                  className="font-khmer"
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-600 mb-3 block">Documentation</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reference">Reference</Label>
                    <Textarea
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Reference information"
                      className="font-khmer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="official_note">Official Note</Label>
                    <Textarea
                      id="official_note"
                      value={formData.official_note}
                      onChange={(e) => setFormData({ ...formData, official_note: e.target.value })}
                      placeholder="Official note"
                      className="font-khmer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note_by_checker">Note by Checker</Label>
                    <Textarea
                      id="note_by_checker"
                      value={formData.note_by_checker}
                      onChange={(e) => setFormData({ ...formData, note_by_checker: e.target.value })}
                      placeholder="Checker's note"
                      className="font-khmer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  {editingRecord ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
