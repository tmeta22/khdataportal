"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, MapPin, AlertCircle, CheckCircle, Download, StopCircle, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CoordinateRecord {
  zipCode: string
  name: string
  longitude: string
  latitude: string
  typeOfLocation: string
}

interface ImportStats {
  processed: number
  updated: number
  skipped: number
  errors: number
}

interface ImportError {
  record: CoordinateRecord
  error: string
}

interface FieldMapping {
  zipCode: string
  name: string
  longitude: string
  latitude: string
  typeOfLocation: string
}

export function CoordinateImport() {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<ImportStats>({ processed: 0, updated: 0, skipped: 0, errors: 0 })
  const [errors, setErrors] = useState<ImportError[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    zipCode: "Zip Code",
    name: "Name",
    longitude: "decimal_longitude",
    latitude: "decimal_latitude",
    typeOfLocation: "Type of Location",
  })

  const supabase = createClient()

  const parseCoordinate = (coord: string): number | null => {
    try {
      console.log("[v0] Parsing coordinate:", coord)

      // Clean the string
      let cleanCoord = coord.replace(/["""]/g, '"').trim()

      // Check if it's already in decimal format
      const decimalMatch = cleanCoord.match(/^-?(\d+\.?\d*)$/)
      if (decimalMatch) {
        const decimal = Number.parseFloat(decimalMatch[1])
        console.log("[v0] Parsed as decimal:", decimal)
        return decimal
      }

      // Try to parse as DMS format
      const direction = cleanCoord.match(/[NSEW]/)?.[0]
      if (!direction) {
        console.log("[v0] No direction found, trying as decimal:", cleanCoord)
        const decimal = Number.parseFloat(cleanCoord)
        return isNaN(decimal) ? null : decimal
      }

      // Remove direction and clean
      cleanCoord = cleanCoord.replace(/[NSEW]/g, "").trim()

      // Try multiple regex patterns for different DMS formats
      const patterns = [
        /(\d+)°\s*(\d+)'\s*([\d.]+)"/, // 102° 36' 46.133"
        /(\d+)°(\d+)'([\d.]+)"/, // 102°36'46.133"
        /(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"/, // 102 ° 36 ' 46.133 "
        /(\d+)°\s*(\d+)'\s*([\d.]+)/, // 102° 36' 46.133 (no closing quote)
      ]

      let match = null
      for (const pattern of patterns) {
        match = cleanCoord.match(pattern)
        if (match) {
          console.log("[v0] Matched DMS pattern:", pattern, "Result:", match)
          break
        }
      }

      if (!match) {
        console.log("[v0] No DMS pattern matched, trying as decimal:", cleanCoord)
        const decimal = Number.parseFloat(cleanCoord)
        return isNaN(decimal) ? null : decimal
      }

      const degrees = Number.parseInt(match[1])
      const minutes = Number.parseInt(match[2])
      const seconds = Number.parseFloat(match[3])

      console.log("[v0] Parsed DMS components:", { degrees, minutes, seconds, direction })

      if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) {
        console.log("[v0] Invalid numeric components")
        return null
      }

      let decimal = degrees + minutes / 60 + seconds / 3600

      // Apply direction (negative for South and West)
      if (direction === "S" || direction === "W") {
        decimal = -decimal
      }

      console.log("[v0] Final decimal coordinate:", decimal)
      return decimal
    } catch (error) {
      console.error("[v0] Error parsing coordinate:", coord, error)
      return null
    }
  }

  const getTableName = (type: string): string => {
    const normalizedType = type.toLowerCase()
    switch (normalizedType) {
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
        return "villages" // Default fallback
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    console.log("[v0] File selected:", selectedFile?.name, selectedFile?.type)

    if (
      selectedFile &&
      (selectedFile.type === "text/csv" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type === "application/csv" ||
        selectedFile.name.toLowerCase().endsWith(".csv"))
    ) {
      setFile(selectedFile)
      setImportComplete(false)
      setErrors([])
      setStats({ processed: 0, updated: 0, skipped: 0, errors: 0 })

      parseCSVHeaders(selectedFile)
      console.log("[v0] CSV file accepted:", selectedFile.name)
    } else {
      console.log("[v0] Invalid file type or no file selected")
    }
  }

  const parseCSVHeaders = async (file: File) => {
    try {
      const csvText = await file.text()
      const lines = csvText.split("\n").filter((line) => line.trim())
      if (lines.length > 0) {
        const headers = parseCSVLine(lines[0])
        setCsvHeaders(headers)
        console.log("[v0] CSV Headers detected:", headers)

        const autoMapping = { ...fieldMapping }
        headers.forEach((header, index) => {
          const lowerHeader = header.toLowerCase()
          if (lowerHeader.includes("decimal_latitude") || lowerHeader.includes("lat")) {
            autoMapping.latitude = header
          }
          if (lowerHeader.includes("decimal_longitude") || lowerHeader.includes("lng") || lowerHeader.includes("lon")) {
            autoMapping.longitude = header
          }
          if (lowerHeader.includes("code") || lowerHeader.includes("zip")) {
            autoMapping.zipCode = header
          }
          if (lowerHeader.includes("name") && !lowerHeader.includes("type")) {
            autoMapping.name = header
          }
          if (lowerHeader.includes("type") || lowerHeader.includes("location")) {
            autoMapping.typeOfLocation = header
          }
        })
        setFieldMapping(autoMapping)
      }
    } catch (error) {
      console.error("[v0] Error parsing CSV headers:", error)
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const parseCSV = (csvText: string): CoordinateRecord[] => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = parseCSVLine(lines[0])
    console.log("[v0] CSV Headers:", headers)

    const indices = {
      zipCode: headers.indexOf(fieldMapping.zipCode),
      name: headers.indexOf(fieldMapping.name),
      longitude: headers.indexOf(fieldMapping.longitude),
      latitude: headers.indexOf(fieldMapping.latitude),
      typeOfLocation: headers.indexOf(fieldMapping.typeOfLocation),
    }

    console.log("[v0] Field mapping indices:", indices)

    return lines
      .slice(1)
      .map((line, index) => {
        const values = parseCSVLine(line)
        console.log(`[v0] Parsing line ${index + 1}:`, values)

        return {
          zipCode: indices.zipCode >= 0 ? values[indices.zipCode] || "" : "",
          name: indices.name >= 0 ? values[indices.name] || "" : "",
          longitude: indices.longitude >= 0 ? values[indices.longitude] || "" : "",
          latitude: indices.latitude >= 0 ? values[indices.latitude] || "" : "",
          typeOfLocation: indices.typeOfLocation >= 0 ? values[indices.typeOfLocation] || "" : "",
        }
      })
      .filter((record) => record.zipCode && record.name)
  }

  const updateCoordinates = async (
    record: CoordinateRecord,
  ): Promise<{ success: boolean; error?: string; skipped?: boolean }> => {
    try {
      const lat = parseCoordinate(record.latitude)
      const lng = parseCoordinate(record.longitude)

      if (lat === null || lng === null) {
        return { success: false, error: "Invalid coordinate format" }
      }

      const tableName = getTableName(record.typeOfLocation)

      const { data: existingData } = await supabase
        .from(tableName)
        .select("latitude, longitude")
        .eq("code", record.zipCode)
        .single()

      if (existingData && existingData.latitude && existingData.longitude) {
        console.log("[v0] Skipping - coordinates already exist for:", record.name)
        return { success: true, skipped: true }
      }

      const { error } = await supabase
        .from(tableName)
        .update({
          latitude: lat,
          longitude: lng,
          updated_at: new Date().toISOString(),
        })
        .eq("code", record.zipCode)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  const handleImport = async () => {
    console.log("[v0] Import button clicked, file:", file?.name)

    if (!file) {
      console.log("[v0] No file selected, cannot import")
      return
    }

    console.log("[v0] Starting coordinate import process...")
    setIsImporting(true)
    setProgress(0)
    setStats({ processed: 0, updated: 0, skipped: 0, errors: 0 })
    setErrors([])
    setImportComplete(false)

    abortControllerRef.current = new AbortController()

    try {
      const csvText = await file.text()
      const records = parseCSV(csvText)

      console.log("[v0] Starting coordinate import for", records.length, "records")

      const currentStats = { processed: 0, updated: 0, skipped: 0, errors: 0 }
      const currentErrors: ImportError[] = []

      for (let i = 0; i < records.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log("[v0] Import cancelled by user")
          break
        }

        const record = records[i]
        console.log("[v0] Processing coordinate for:", record.name, "Type:", record.typeOfLocation)

        const result = await updateCoordinates(record)

        if (result.success) {
          if (result.skipped) {
            currentStats.skipped++
            console.log("[v0] Skipped existing coordinates for:", record.name)
          } else {
            currentStats.updated++
            console.log("[v0] Successfully updated coordinates for:", record.name)
          }
        } else {
          currentStats.errors++
          currentErrors.push({ record, error: result.error || "Unknown error" })
          console.log("[v0] Error updating coordinates for:", record.name, result.error)
        }

        currentStats.processed++
        setStats({ ...currentStats })
        setProgress((currentStats.processed / records.length) * 100)

        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      setErrors(currentErrors)
      setImportComplete(true)
      console.log("[v0] Coordinate import completed:", currentStats)
    } catch (error) {
      console.error("[v0] Import error:", error)
      setErrors([
        {
          record: { zipCode: "", name: "Import Error", longitude: "", latitude: "", typeOfLocation: "" },
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ])
    } finally {
      setIsImporting(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      console.log("[v0] Stopping coordinate import...")
    }
  }

  const exportErrorReport = () => {
    const errorData = errors.map(({ record, error }) => ({
      "Zip Code": record.zipCode,
      Name: record.name,
      Type: record.typeOfLocation,
      Error: error,
    }))

    const csvContent = [
      Object.keys(errorData[0] || {}).join(","),
      ...errorData.map((row) => Object.values(row).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `coordinate-import-errors-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Import Coordinates
          </CardTitle>
          <CardDescription>
            Import geographical coordinates for administrative locations. Supports both decimal and DMS formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="coordinate-file">Select CSV File</Label>
            <Input
              id="coordinate-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={isImporting}
            />
          </div>

          {file && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}

          {csvHeaders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="w-4 h-4" />
                  Field Mapping
                </CardTitle>
                <CardDescription>
                  Map your CSV columns to the required fields. Auto-detected mappings are shown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip-code-mapping">Administrative Code</Label>
                    <select
                      id="zip-code-mapping"
                      value={fieldMapping.zipCode}
                      onChange={(e) => setFieldMapping({ ...fieldMapping, zipCode: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="name-mapping">Location Name</Label>
                    <select
                      id="name-mapping"
                      value={fieldMapping.name}
                      onChange={(e) => setFieldMapping({ ...fieldMapping, name: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="latitude-mapping">Latitude</Label>
                    <select
                      id="latitude-mapping"
                      value={fieldMapping.latitude}
                      onChange={(e) => setFieldMapping({ ...fieldMapping, latitude: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="longitude-mapping">Longitude</Label>
                    <select
                      id="longitude-mapping"
                      value={fieldMapping.longitude}
                      onChange={(e) => setFieldMapping({ ...fieldMapping, longitude: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="type-mapping">Administrative Type</Label>
                    <select
                      id="type-mapping"
                      value={fieldMapping.typeOfLocation}
                      onChange={(e) => setFieldMapping({ ...fieldMapping, typeOfLocation: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                console.log("[v0] Import button clicked, file state:", !!file, "isImporting:", isImporting)
                handleImport()
              }}
              disabled={!file || isImporting || csvHeaders.length === 0}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importing..." : "Import Coordinates"}
            </Button>

            {isImporting && (
              <Button onClick={handleStop} variant="destructive" className="flex items-center gap-2">
                <StopCircle className="w-4 h-4" />
                Stop Import
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className={stats.errors > 0 ? "border-yellow-500" : "border-green-500"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully updated {stats.updated} coordinates with {stats.errors} errors
                </AlertDescription>
              </Alert>

              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setShowErrors(!showErrors)}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      View Errors ({errors.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportErrorReport}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Download className="w-4 h-4" />
                      Export Error Report
                    </Button>
                  </div>

                  {showErrors && (
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded p-4">
                      {errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm">
                          <Badge variant="destructive" className="mr-2">
                            {error.record.typeOfLocation} {error.record.zipCode}
                          </Badge>
                          {error.record.name}: {error.error}
                        </div>
                      ))}
                      {errors.length > 10 && (
                        <div className="text-sm text-muted-foreground">... and {errors.length - 10} more</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Required Columns (can be mapped above):</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <code>Administrative Code</code> - Administrative code (e.g., 1020101)
              </li>
              <li>
                <code>Location Name</code> - Location name
              </li>
              <li>
                <code>Latitude</code> - In decimal format (e.g., 13.58885) or DMS format (e.g., N13° 42' 28.530")
              </li>
              <li>
                <code>Longitude</code> - In decimal format (e.g., 102.96833) or DMS format (e.g., E102° 36' 46.133")
              </li>
              <li>
                <code>Administrative Type</code> - Province, District, Municipality, Khan, Commune, Sangkat, or Village
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              <strong>Note:</strong> The import will skip records that already have coordinates to prevent overwriting
              existing data. Use field mapping above to match your CSV column names.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
