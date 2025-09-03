"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Eye, Settings, Square, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"

interface ImportResult {
  success: boolean
  message: string
  processed: number
  skipped: number
  errors: string[]
}

interface ColumnMapping {
  [key: string]: string
}

interface ParsedData {
  headers: string[]
  rows: string[][]
  preview: any[]
}

export function DataImport() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error" | "cancelled">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    type: "",
    code: "",
    name_khmer: "",
    name_latin: "",
    reference: "",
    official_note: "",
    note_by_checker: "",
  })
  const [showMapping, setShowMapping] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  const requiredColumns = [
    { key: "type", label: "Type", description: "Administrative level (ខេត្ត, ស្រុក, ក្រុង, ឃុំ, សង្កាត់, ភូមិ)" },
    { key: "code", label: "Code", description: "Gazetteer code" },
    { key: "name_khmer", label: "Name (Khmer)", description: "Name in Khmer script" },
    { key: "name_latin", label: "Name (Latin)", description: "Name in Latin script" },
  ]

  const optionalColumns = [
    { key: "reference", label: "Reference", description: "Official reference document" },
    { key: "official_note", label: "Official Note", description: "Official notes" },
    { key: "note_by_checker", label: "Note by Checker", description: "Checker notes" },
  ]

  const getSupabaseClient = () => {
    try {
      return createClient()
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      return null
    }
  }

  const detectParentCode = (code: string, type: string): string | null => {
    if (!code) return null

    const normalizedType = normalizeType(type)
    console.log("[v0] Detecting parent code for:", code, "type:", normalizedType)

    switch (normalizedType) {
      case "municipality":
      case "district":
      case "khan":
        // For districts/municipalities/khans, parent is province
        // Try different patterns based on code length and structure
        if (code.length === 3) {
          // 3-digit district -> parent is first digit (province 1-9)
          return code.substring(0, 1)
        } else if (code.length === 4) {
          // 4-digit district -> check if starts with 10-25 (2-digit province) or 1-9 (1-digit province)
          const firstTwo = code.substring(0, 2)
          const firstOne = code.substring(0, 1)

          const twoDigitNum = Number.parseInt(firstTwo)
          if (twoDigitNum >= 10 && twoDigitNum <= 25) {
            console.log("[v0] 4-digit code with 2-digit province:", firstTwo)
            return firstTwo
          } else {
            console.log("[v0] 4-digit code with 1-digit province:", firstOne)
            return firstOne
          }
        }
        return null

      case "sangkat":
      case "commune":
        // For communes/sangkats, parent is district
        // Communes are typically 5-6 digits, districts are 3-4 digits
        if (code.length === 5) {
          // 5-digit commune -> parent is first 3 digits (district)
          return code.substring(0, 3)
        } else if (code.length === 6) {
          // 6-digit commune -> parent is first 4 digits (district)
          return code.substring(0, 4)
        }
        return null

      case "village":
        // For villages, parent is commune/sangkat
        // Villages are 7+ digits, communes are 5-6 digits
        if (code.length === 7) {
          // 7-digit village -> parent is first 5 digits (commune)
          return code.substring(0, 5)
        } else if (code.length >= 8) {
          // 8+ digit village -> parent is first 6 digits (commune)
          return code.substring(0, 6)
        }
        return null

      default:
        console.warn("[v0] Unknown type for parent detection:", normalizedType)
        return null
    }
  }

  const normalizeType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      // Khmer types
      ខេត្ត: "province",
      ស្រុក: "district",
      ក្រុង: "municipality",
      ឃុំ: "commune",
      សង្កាត់: "sangkat",
      ភូមិ: "village",
      // English types (case insensitive)
      province: "province",
      municipality: "municipality",
      district: "district",
      khan: "khan", // Keep khan separate from district
      sangkat: "sangkat", // Keep sangkat separate from commune
      commune: "commune",
      village: "village",
    }
    return typeMap[type.toLowerCase()] || type.toLowerCase()
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFileSelection(files)
  }

  const processFile = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const data = e.target?.result

          if (file.type === "text/csv" || file.name.endsWith(".csv")) {
            const text = data as string
            const lines = text.split("\n").filter((line) => line.trim())
            const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

            const rows = lines.slice(1).map((line) => {
              return line.split(",").map((v) => v.trim().replace(/"/g, ""))
            })

            const preview = rows.slice(0, 5).map((row) => {
              const record: any = {}
              headers.forEach((header, index) => {
                record[header] = row[index] || ""
              })
              return record
            })

            resolve({ headers, rows, preview })
          } else {
            reject(new Error("Excel processing requires additional library. Please use CSV format."))
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const insertAdministrativeData = async (records: any[]): Promise<ImportResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return {
        success: false,
        message: "Database connection not available. Please check your environment variables.",
        processed: 0,
        skipped: 0,
        errors: ["Supabase client creation failed"],
      }
    }

    const errors: string[] = []
    let processed = 0
    let skipped = 0 // Track skipped records properly

    try {
      console.log("[v0] Starting hierarchical import process with", records.length, "records")

      const recordsByType = {
        provinces: [] as any[],
        municipalities: [] as any[],
        districts: [] as any[],
        khans: [] as any[],
        communes: [] as any[],
        sangkats: [] as any[],
        villages: [] as any[],
      }

      // Group records by type
      records.forEach((record) => {
        const normalizedType = normalizeType(record.type || "")
        console.log("[v0] Grouping record:", record.code, "as type:", normalizedType)

        switch (normalizedType) {
          case "province":
            recordsByType.provinces.push(record)
            break
          case "municipality":
            recordsByType.municipalities.push(record)
            break
          case "district":
            recordsByType.districts.push(record)
            break
          case "khan":
            recordsByType.khans.push(record)
            break
          case "commune":
            recordsByType.communes.push(record)
            break
          case "sangkat":
            recordsByType.sangkats.push(record)
            break
          case "village":
            recordsByType.villages.push(record)
            break
          default:
            console.warn("[v0] Unknown type:", normalizedType, "for record:", record.code)
        }
      })

      console.log("[v0] Record counts by type:", {
        provinces: recordsByType.provinces.length,
        municipalities: recordsByType.municipalities.length,
        districts: recordsByType.districts.length,
        khans: recordsByType.khans.length,
        communes: recordsByType.communes.length,
        sangkats: recordsByType.sangkats.length,
        villages: recordsByType.villages.length,
      })

      const hasChildRecords =
        recordsByType.municipalities.length > 0 ||
        recordsByType.districts.length > 0 ||
        recordsByType.khans.length > 0 ||
        recordsByType.communes.length > 0 ||
        recordsByType.sangkats.length > 0 ||
        recordsByType.villages.length > 0

      if (hasChildRecords && recordsByType.provinces.length === 0) {
        // Check if provinces exist in database
        const { data: existingProvinces } = await supabase.from("provinces").select("id, code").limit(1)

        if (!existingProvinces || existingProvinces.length === 0) {
          return {
            success: false,
            message:
              "Cannot import child records without provinces. Please import province records first, or include province records in your CSV file.",
            processed: 0,
            skipped: 0,
            errors: ["No provinces found in database and no province records in CSV file. Import provinces first."],
          }
        }
      }

      const createdProvinces = new Map<string, string>() // code -> id
      const createdDistricts = new Map<string, string>() // code -> id
      const createdCommunes = new Map<string, string>() // code -> id

      const totalRecords = records.length
      let currentRecord = 0

      const controller = new AbortController()
      setAbortController(controller)

      console.log("[v0] Step 1: Inserting provinces...")
      for (const record of recordsByType.provinces) {
        if (controller.signal.aborted) break

        currentRecord++
        setUploadProgress(Math.round((currentRecord / totalRecords) * 100))

        try {
          const { data: existingProvince } = await supabase
            .from("provinces")
            .select("id, code")
            .eq("code", record.code)
            .single()

          if (existingProvince) {
            console.log("[v0] Province already exists, skipping:", record.code)
            createdProvinces.set(record.code, existingProvince.id)
            skipped++
            continue
          }

          const recordData = {
            code: record.code || "",
            name_khmer: record.name_khmer || "",
            name_latin: record.name_latin || record.name || "",
            reference: record.reference || "",
            official_note: record.official_note || "",
            note_by_checker: record.note_by_checker || "",
          }

          console.log("[v0] Inserting province:", recordData.code)

          const { data, error } = await supabase.from("provinces").insert(recordData).select("id, code").single()

          if (error) {
            console.error("[v0] Province insert error:", error)
            errors.push(`Province ${record.code}: ${error.message}`)
          } else {
            createdProvinces.set(record.code, data.id)
            processed++
            console.log("[v0] Successfully inserted province:", record.code, "with ID:", data.id)
          }
        } catch (recordError) {
          console.error("[v0] Province processing error:", recordError)
          errors.push(
            `Province ${record.code}: ${recordError instanceof Error ? recordError.message : "Unknown error"}`,
          )
        }
      }

      console.log("[v0] Created provinces:", Array.from(createdProvinces.keys()))

      console.log("[v0] Step 2: Inserting districts/municipalities/khans...")
      for (const record of [...recordsByType.municipalities, ...recordsByType.districts, ...recordsByType.khans]) {
        if (controller.signal.aborted) break

        currentRecord++
        setUploadProgress(Math.round((currentRecord / totalRecords) * 100))

        try {
          const normalizedType = normalizeType(record.type || "")
          const parentCode = detectParentCode(record.code, record.type)

          console.log("[v0] Processing", normalizedType, record.code, "-> parent code:", parentCode)

          if (!parentCode) {
            errors.push(`${normalizedType} ${record.code}: Could not determine parent code`)
            continue
          }

          const parentId = createdProvinces.get(parentCode)
          if (!parentId) {
            console.error("[v0] Parent province not found:", parentCode, "for", normalizedType, record.code)
            console.error("[v0] Available provinces:", Array.from(createdProvinces.keys()))
            errors.push(`${normalizedType} ${record.code}: Parent province ${parentCode} not found`)
            continue
          }

          const { data: existingDistrict } = await supabase
            .from("districts")
            .select("id, code")
            .eq("code", record.code)
            .single()

          if (existingDistrict) {
            console.log("[v0] District already exists, skipping:", record.code)
            createdDistricts.set(record.code, existingDistrict.id)
            skipped++
            continue
          }

          const recordData = {
            code: record.code || "",
            name_khmer: record.name_khmer || "",
            name_latin: record.name_latin || record.name || "",
            reference: record.reference || "",
            official_note: record.official_note || "",
            note_by_checker: record.note_by_checker || "",
            type: normalizedType,
            province_id: parentId,
          }

          console.log("[v0] Inserting", normalizedType, ":", recordData.code, "with parent ID:", parentId)

          const { data, error } = await supabase.from("districts").insert(recordData).select("id, code").single()

          if (error) {
            console.error("[v0] District insert error:", error)
            errors.push(`${normalizedType} ${record.code}: ${error.message}`)
          } else {
            createdDistricts.set(record.code, data.id)
            processed++
            console.log("[v0] Successfully inserted", normalizedType, ":", record.code, "with ID:", data.id)
          }
        } catch (recordError) {
          console.error("[v0] District processing error:", recordError)
          errors.push(`${record.code}: ${recordError instanceof Error ? recordError.message : "Unknown error"}`)
        }
      }

      console.log("[v0] Created districts:", Array.from(createdDistricts.keys()))

      console.log("[v0] Step 3: Inserting communes/sangkats...")
      for (const record of [...recordsByType.communes, ...recordsByType.sangkats]) {
        if (controller.signal.aborted) break

        currentRecord++
        setUploadProgress(Math.round((currentRecord / totalRecords) * 100))

        try {
          const normalizedType = normalizeType(record.type || "")
          const parentCode = detectParentCode(record.code, record.type)

          console.log("[v0] Processing", normalizedType, record.code, "-> parent code:", parentCode)

          if (!parentCode) {
            errors.push(`${normalizedType} ${record.code}: Could not determine parent code`)
            continue
          }

          const parentId = createdDistricts.get(parentCode)
          if (!parentId) {
            console.error("[v0] Parent district not found:", parentCode, "for", normalizedType, record.code)
            console.error("[v0] Available districts:", Array.from(createdDistricts.keys()))
            errors.push(`${normalizedType} ${record.code}: Parent district ${parentCode} not found`)
            continue
          }

          const { data: existingCommune } = await supabase
            .from("communes")
            .select("id, code")
            .eq("code", record.code)
            .single()

          if (existingCommune) {
            console.log("[v0] Commune already exists, skipping:", record.code)
            createdCommunes.set(record.code, existingCommune.id)
            skipped++
            continue
          }

          const recordData = {
            code: record.code || "",
            name_khmer: record.name_khmer || "",
            name_latin: record.name_latin || record.name || "",
            reference: record.reference || "",
            official_note: record.official_note || "",
            note_by_checker: record.note_by_checker || "",
            type: normalizedType,
            district_id: parentId,
          }

          console.log("[v0] Inserting", normalizedType, ":", recordData.code, "with parent ID:", parentId)

          const { data, error } = await supabase.from("communes").insert(recordData).select("id, code").single()

          if (error) {
            console.error("[v0] Commune insert error:", error)
            errors.push(`${normalizedType} ${record.code}: ${error.message}`)
          } else {
            createdCommunes.set(record.code, data.id)
            processed++
            console.log("[v0] Successfully inserted", normalizedType, ":", record.code, "with ID:", data.id)
          }
        } catch (recordError) {
          console.error("[v0] Commune processing error:", recordError)
          errors.push(`${record.code}: ${recordError instanceof Error ? recordError.message : "Unknown error"}`)
        }
      }

      console.log("[v0] Created communes:", Array.from(createdCommunes.keys()))

      console.log("[v0] Step 4: Inserting villages...")
      for (const record of recordsByType.villages) {
        if (controller.signal.aborted) break

        currentRecord++
        setUploadProgress(Math.round((currentRecord / totalRecords) * 100))

        try {
          const parentCode = detectParentCode(record.code, record.type)

          console.log("[v0] Processing village:", record.code, "-> parent code:", parentCode)

          if (!parentCode) {
            errors.push(`Village ${record.code}: Could not determine parent code`)
            continue
          }

          const parentId = createdCommunes.get(parentCode)
          if (!parentId) {
            console.error("[v0] Parent commune not found:", parentCode, "for village", record.code)
            console.error("[v0] Available communes:", Array.from(createdCommunes.keys()))
            errors.push(`Village ${record.code}: Parent commune ${parentCode} not found`)
            continue
          }

          const { data: existingVillage } = await supabase
            .from("villages")
            .select("id, code")
            .eq("code", record.code)
            .single()

          if (existingVillage) {
            console.log("[v0] Village already exists, skipping:", record.code)
            skipped++
            continue
          }

          const recordData = {
            code: record.code || "",
            name_khmer: record.name_khmer || "",
            name_latin: record.name_latin || record.name || "",
            reference: record.reference || "",
            official_note: record.official_note || "",
            note_by_checker: record.note_by_checker || "",
            commune_id: parentId,
          }

          console.log("[v0] Inserting village:", recordData.code, "with parent ID:", parentId)

          const { error } = await supabase.from("villages").insert(recordData).select("id, code").single()

          if (error) {
            console.error("[v0] Village insert error:", error)
            errors.push(`Village ${record.code}: ${error.message}`)
          } else {
            processed++
            console.log("[v0] Successfully inserted village:", record.code)
          }
        } catch (recordError) {
          console.error("[v0] Village processing error:", recordError)
          errors.push(`${record.code}: ${recordError instanceof Error ? recordError.message : "Unknown error"}`)
        }
      }

      const successMessage = `Successfully imported ${processed} records${skipped > 0 ? `, skipped ${skipped} existing records` : ""}${errors.length > 0 ? ` with ${errors.length} errors` : ""}`

      console.log("[v0] Hierarchical import completed:", { processed, skipped, errors: errors.length })

      return {
        success: processed > 0,
        message: successMessage,
        processed,
        skipped,
        errors,
      }
    } catch (error) {
      console.error("[v0] Import process error:", error)
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        processed,
        skipped,
        errors: [...errors, error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }

  const handleFileSelection = async (files: File[]) => {
    const validFiles = files.filter(
      (file) =>
        file.type === "text/csv" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls"),
    )

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      setUploadStatus("idle")
      setImportResult(null)

      try {
        const parsed = await processFile(validFiles[0])
        setParsedData(parsed)

        const autoMapping: ColumnMapping = {}
        parsed.headers.forEach((header) => {
          const lowerHeader = header.toLowerCase()
          if (lowerHeader.includes("type") || lowerHeader.includes("ប្រភេទ")) {
            autoMapping.type = header
          } else if (lowerHeader.includes("code") || lowerHeader.includes("កូដ")) {
            autoMapping.code = header
          } else if (lowerHeader.includes("name_khmer") || lowerHeader.includes("ខ្មែរ")) {
            autoMapping.name_khmer = header
          } else if (lowerHeader.includes("name_latin") || lowerHeader.includes("latin")) {
            autoMapping.name_latin = header
          } else if (lowerHeader.includes("reference") || lowerHeader.includes("យោង")) {
            autoMapping.reference = header
          } else if (lowerHeader.includes("official_note") || lowerHeader.includes("official")) {
            autoMapping.official_note = header
          } else if (lowerHeader.includes("note_by_checker") || lowerHeader.includes("checker")) {
            autoMapping.note_by_checker = header
          }
        })
        setColumnMapping(autoMapping)
      } catch (error) {
        console.error("[v0] File parsing error:", error)
      }
    } else {
      setUploadStatus("error")
      setImportResult({
        success: false,
        message: "Please select valid CSV or Excel files only.",
        processed: 0,
        skipped: 0,
        errors: ["Invalid file format"],
      })
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !parsedData) return

    setUploadStatus("uploading")
    setUploadProgress(0)

    try {
      console.log("[v0] Starting upload process...")

      const mappedRecords = parsedData.rows.map((row) => {
        const record: any = {}
        Object.entries(columnMapping).forEach(([targetColumn, sourceColumn]) => {
          const columnIndex = parsedData.headers.indexOf(sourceColumn)
          if (columnIndex !== -1) {
            record[targetColumn] = row[columnIndex] || ""
          }
        })
        return record
      })

      console.log("[v0] Mapped records sample:", mappedRecords.slice(0, 3))
      setUploadProgress(50)

      const result = await insertAdministrativeData(mappedRecords)
      setUploadProgress(100)

      console.log("[v0] Upload result:", result)
      setImportResult(result)
      setUploadStatus(result.success ? "success" : "error")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadStatus("error")
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        processed: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      })
    }
  }

  const handleStopImport = () => {
    console.log("[v0] User requested import cancellation")
    if (abortController) {
      abortController.abort()
      setUploadStatus("cancelled")
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index))
  }

  const handleExportErrors = () => {
    if (importResult && importResult.errors.length > 0) {
      const errorData = {
        timestamp: new Date().toISOString(),
        totalErrors: importResult.errors.length,
        errors: importResult.errors.map((error, index) => ({
          row: index + 1,
          error: error,
        })),
      }

      const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `import_errors_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Import Administrative Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-border hover:border-muted-foreground"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Upload CSV or Excel Files</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your administrative data files here, or click to browse
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelection(Array.from(e.target.files || []))}
            />
            <p className="text-sm text-muted-foreground mt-2">Supported formats: CSV, XLSX, XLS</p>
          </div>

          {selectedFiles.length > 0 && parsedData && (
            <div className="mt-4 space-y-4">
              <h4 className="font-medium">Selected Files:</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Dialog open={showMapping} onOpenChange={setShowMapping}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Map Columns
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Column Mapping</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {[...requiredColumns, ...optionalColumns].map((column) => (
                        <div key={column.key} className="space-y-2">
                          <Label htmlFor={column.key}>
                            {column.label} {requiredColumns.includes(column) && <span className="text-red-500">*</span>}
                          </Label>
                          <Select
                            value={columnMapping[column.key] || "none"}
                            onValueChange={(value) => setColumnMapping((prev) => ({ ...prev, [column.key]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {parsedData.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">{column.description}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Data Preview (First 5 rows)</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {parsedData.headers.map((header) => (
                              <TableHead key={header} className="font-khmer">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.preview.map((row, index) => (
                            <TableRow key={index}>
                              {parsedData.headers.map((header) => (
                                <TableCell key={header} className="font-khmer">
                                  {row[header]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={
                    uploadStatus === "uploading" || !requiredColumns.every((col) => columnMapping[col.key] !== "")
                  }
                >
                  {uploadStatus === "uploading" ? "Processing..." : "Import Data"}
                </Button>

                {uploadStatus === "uploading" && (
                  <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleStopImport}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Import
                  </Button>
                )}
              </div>

              {importResult && importResult.errors.length > 0 && (
                <Button variant="outline" className="w-full mt-2 bg-transparent" onClick={handleExportErrors}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Error Report
                </Button>
              )}
            </div>
          )}

          {uploadStatus === "uploading" && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="mb-2" />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Processing your data... {uploadProgress}%
                  <br />
                  <span className="text-xs text-muted-foreground">Click "Stop Import" to cancel the process</span>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {uploadStatus === "cancelled" && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Import was cancelled by user. You can restart the import process anytime.
              </AlertDescription>
            </Alert>
          )}

          {importResult && uploadStatus !== "cancelled" && (
            <Alert
              className={`mt-4 ${importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
                {importResult.message}
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <details>
                      <summary className="cursor-pointer">View Errors ({importResult.errors.length})</summary>
                      <ul className="mt-1 text-xs">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {importResult.errors.length > 10 && <li>... and {importResult.errors.length - 10} more</li>}
                      </ul>
                    </details>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {requiredColumns.map((col) => (
                  <li key={col.key}>
                    • <code className="bg-muted px-1 rounded">{col.key}</code> - {col.description}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Optional Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {optionalColumns.map((col) => (
                  <li key={col.key}>
                    • <code className="bg-muted px-1 rounded">{col.key}</code> - {col.description}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Supported Administrative Types:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <strong>English:</strong> Province, Municipality, District, Khan, Sangkat, Commune, Village
                </li>
                <li>
                  • <strong>Khmer:</strong> ខេត្ត, ស្រុក, ក្រុង, ឃុំ, សង្កាត់, ភូមិ
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Automatic Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Parent codes automatically detected from hierarchical structure</li>
                <li>• Municipality support (3-digit codes under provinces)</li>
                <li>• District/Khan can be under provinces (2-digit parent) or municipalities (3-digit parent)</li>
                <li>• Commune/Sangkat can be under districts (varies by length)</li>
                <li>• Column mapping with auto-detection and preview functionality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
