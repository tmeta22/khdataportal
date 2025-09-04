"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, BarChart3, AlertCircle, CheckCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface CensusImportProps {
  onImportComplete?: () => void
}

export function CensusImport({ onImportComplete }: CensusImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [year, setYear] = useState<string>("2019")
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    processed: number
    imported: number
    updated: number
    skipped: number
    errors: number
    errorDetails: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({
    pro_code: "",
    provinces: "",
    households: "",
    males: "",
    females: "",
    total: "",
  })

  const supabase = createClientComponentClient()

  const requiredFields = [
    { key: "pro_code", label: "Province Code", required: true },
    { key: "provinces_kh", label: "Province Name (Khmer)", required: false },
    { key: "provinces", label: "Province Name (English)", required: true },
    { key: "households", label: "Households", required: true },
    { key: "males", label: "Males", required: true },
    { key: "females", label: "Females", required: true },
    { key: "total", label: "Total Population", required: true },
    { key: "household_size", label: "Household Size", required: false },
    { key: "area_km2", label: "Area (km²)", required: false },
    { key: "pop_km2", label: "Population Density (per km²)", required: false },
  ]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      console.log("[v0] Census file selected:", selectedFile.name, selectedFile.type)

      const validTypes = ["text/csv", "application/vnd.ms-excel", "text/plain"]
      const isValidType = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith(".csv")

      if (!isValidType) {
        setError("Please select a valid CSV file")
        return
      }

      setFile(selectedFile)
      setError(null)
      setResults(null)

      try {
        const fileContent = await selectedFile.text()
        const lines = fileContent.split("\n").filter((line) => line.trim())

        if (lines.length > 0) {
          const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
          const sampleRow = lines[1] ? lines[1].split(",").map((c) => c.trim().replace(/"/g, "")) : []

          setPreview({
            totalRows: lines.length - 1,
            headers,
            sampleRow,
          })

          // Auto-detect field mappings
          const autoMapping: { [key: string]: string } = {}
          requiredFields.forEach((field) => {
            const matchingHeader = headers.find(
              (header) =>
                header.toLowerCase().includes(field.key.toLowerCase()) ||
                field.key.toLowerCase().includes(header.toLowerCase()),
            )
            if (matchingHeader) {
              autoMapping[field.key] = matchingHeader
            }
          })
          setFieldMapping(autoMapping)

          console.log("[v0] Census preview:", { headers, autoMapping })
        }
      } catch (previewError) {
        console.error("[v0] Preview error:", previewError)
        setPreview(null)
      }
    }
  }

  const parseCSVRow = (row: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]

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

  const handleImport = async () => {
    if (!file || !year) {
      setError("Please select a file and year")
      return
    }

    // Validate field mappings
    const missingRequired = requiredFields
      .filter((field) => field.required && !fieldMapping[field.key])
      .map((field) => field.label)

    if (missingRequired.length > 0) {
      setError(`Please map required fields: ${missingRequired.join(", ")}`)
      return
    }

    setIsImporting(true)
    setProgress(0)
    setError(null)
    setResults(null)

    try {
      console.log("[v0] Starting census import for year:", year)

      const fileContent = await file.text()
      const lines = fileContent.split("\n").filter((line) => line.trim())
      const headers = parseCSVRow(lines[0])
      const dataRows = lines.slice(1)

      let processed = 0
      let imported = 0
      let updated = 0
      const skipped = 0
      let errors = 0
      const errorDetails: string[] = []

      console.log("[v0] Processing", dataRows.length, "census records")

      for (let i = 0; i < dataRows.length; i++) {
        const row = parseCSVRow(dataRows[i])
        processed++

        try {
          const rowData: any = { year: Number.parseInt(year) }

          // Map fields based on user selection
          Object.entries(fieldMapping).forEach(([fieldKey, headerName]) => {
            const headerIndex = headers.indexOf(headerName)
            if (headerIndex !== -1 && row[headerIndex] !== undefined) {
              const value = row[headerIndex].replace(/"/g, "").trim()

              // Convert numeric fields
              if (["households", "males", "females", "total"].includes(fieldKey)) {
                const numValue = Number.parseInt(value.replace(/,/g, ""))
                rowData[fieldKey] = isNaN(numValue) ? null : numValue
              } else if (["household_size", "area_km2", "pop_km2"].includes(fieldKey)) {
                const numValue = Number.parseFloat(value.replace(/,/g, ""))
                rowData[fieldKey] = isNaN(numValue) ? null : numValue
              } else {
                rowData[fieldKey] = value || null
              }
            }
          })

          if (!rowData.pro_code || !rowData.provinces) {
            errors++
            errorDetails.push(`Row ${i + 2}: Missing required province code or name`)
            continue
          }

          // Check if record exists
          const { data: existing } = await supabase
            .from("census_data")
            .select("id")
            .eq("year", rowData.year)
            .eq("pro_code", rowData.pro_code)
            .single()

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from("census_data")
              .update({ ...rowData, updated_at: new Date().toISOString() })
              .eq("id", existing.id)

            if (updateError) {
              errors++
              errorDetails.push(`Row ${i + 2}: Update error - ${updateError.message}`)
            } else {
              updated++
              console.log(`[v0] Updated census data for:`, rowData.provinces)
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase.from("census_data").insert(rowData)

            if (insertError) {
              errors++
              errorDetails.push(`Row ${i + 2}: Insert error - ${insertError.message}`)
            } else {
              imported++
              console.log(`[v0] Imported census data for:`, rowData.provinces)
            }
          }
        } catch (rowError) {
          errors++
          errorDetails.push(`Row ${i + 2}: Processing error - ${rowError}`)
        }

        setProgress(Math.round((processed / dataRows.length) * 100))
      }

      setResults({
        processed,
        imported,
        updated,
        skipped,
        errors,
        errorDetails: errorDetails.slice(0, 10),
      })

      console.log("[v0] Census import completed:", { processed, imported, updated, errors })

      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      console.error("[v0] Census import error:", error)
      setError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Import Census Data
        </CardTitle>
        <CardDescription>
          Import Provisional Census data with demographic and geographic statistics. Supports multiple years for
          historical comparison.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="census-year">Census Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select census year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2019">2019 (Provisional Census)</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="census-file">Select CSV File</Label>
            <Input id="census-file" type="file" accept=".csv" onChange={handleFileSelect} disabled={isImporting} />
          </div>
        </div>

        {file && (
          <p className="text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">CSV Preview</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Total Rows:</strong> {preview.totalRows}
                </p>
                <p>
                  <strong>Headers:</strong> {preview.headers.join(", ")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Field Mapping</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`mapping-${field.key}`}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={fieldMapping[field.key] || "-- Not mapped --"}
                      onValueChange={(value) => setFieldMapping((prev) => ({ ...prev, [field.key]: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-- Not mapped --">-- Not mapped --</SelectItem>
                        {preview.headers.map((header: string) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleImport} disabled={!file || !year || isImporting} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? "Importing..." : "Import Census Data"}
        </Button>

        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing census data...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Alert variant={results.errors > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  Import completed: {results.imported} imported, {results.updated} updated, {results.errors} errors
                </p>
                {results.errors > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View Errors ({results.errorDetails.length})
                    </summary>
                    <div className="mt-2 space-y-1 text-xs">
                      {results.errorDetails.map((error, index) => (
                        <div key={index} className="text-red-600">
                          • {error}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Expected CSV Format</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>
              • <strong>Required:</strong> pro_code, provinces, households, males, females, total
            </li>
            <li>
              • <strong>Optional:</strong> provinces_kh, household_size, area_km2, pop_km2
            </li>
            <li>• Numbers can include commas (e.g., "1,234,567")</li>
            <li>• CSV should have headers in the first row</li>
            <li>• Existing data for the same year and province will be updated</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
