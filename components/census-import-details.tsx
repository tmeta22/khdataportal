"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CensusImportDetailsProps {
  provinceName: string
  onImportComplete: () => void
}

export default function CensusImportDetails({ provinceName, onImportComplete }: CensusImportDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    processed?: number
    imported?: number
    errors?: number
  } | null>(null)

  const supabase = createClient()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setImportResult(null)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    })
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const data = parseCSV(text)

      console.log("[v0] Parsed census data:", data)

      let processed = 0
      let imported = 0
      let errors = 0

      for (const row of data) {
        processed++

        try {
          // Map CSV columns to database columns
          const censusRecord = {
            pro_code: row.pro_code || row.Pro_code || "",
            provinces_kh: row.provinces_kh || row.Provinces_kh || "",
            provinces: row.provinces || row.Provinces || row.province_name || "",
            households: Number.parseInt(row.households || row.Households || "0") || 0,
            males: Number.parseInt(row.males || row.Males || "0") || 0,
            females: Number.parseInt(row.females || row.Females || "0") || 0,
            total: Number.parseInt(row.total || row.Total || "0") || 0,
            household_size: Number.parseFloat(row.household_size || row["Household size"] || "0") || 0,
            area_km2: Number.parseFloat(row.area_km2 || row.Area_km2 || "0") || 0,
            pop_km2: Number.parseFloat(row.pop_km2 || row.Pop_km2 || "0") || 0,
            year: 2019, // Default to 2019 census
          }

          // Check if record already exists
          const { data: existing } = await supabase
            .from("census_data")
            .select("id")
            .eq("provinces", censusRecord.provinces)
            .eq("year", censusRecord.year)
            .single()

          if (existing) {
            // Update existing record
            const { error } = await supabase.from("census_data").update(censusRecord).eq("id", existing.id)

            if (error) {
              console.error("[v0] Error updating census record:", error)
              errors++
            } else {
              imported++
              console.log("[v0] Updated census record for:", censusRecord.provinces)
            }
          } else {
            // Insert new record
            const { error } = await supabase.from("census_data").insert(censusRecord)

            if (error) {
              console.error("[v0] Error inserting census record:", error)
              errors++
            } else {
              imported++
              console.log("[v0] Inserted census record for:", censusRecord.provinces)
            }
          }
        } catch (error) {
          console.error("[v0] Error processing row:", error)
          errors++
        }
      }

      setImportResult({
        success: errors === 0,
        message: `Import completed: ${imported} imported, ${errors} errors`,
        processed,
        imported,
        errors,
      })

      if (imported > 0) {
        onImportComplete()
      }
    } catch (error) {
      console.error("[v0] Error importing census data:", error)
      setImportResult({
        success: false,
        message: "Failed to import census data. Please check the file format.",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full justify-start bg-transparent">
        <Upload className="w-4 h-4 mr-2" />
        Import Census Data
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Census Data</DialogTitle>
            <DialogDescription>Upload census data for {provinceName} and other provinces</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="census-file">Select CSV File</Label>
              <Input id="census-file" type="file" accept=".csv" onChange={handleFileSelect} disabled={importing} />
              <p className="text-xs text-muted-foreground">
                Expected columns: pro_code, provinces, households, males, females, total, household_size, area_km2,
                pop_km2
              </p>
            </div>

            {file && (
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              </Card>
            )}

            {importResult && (
              <Card
                className={`p-3 ${importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <div className="flex items-start gap-2">
                  {importResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{importResult.message}</p>
                    {importResult.processed && (
                      <p className="text-xs text-muted-foreground mt-1">Processed: {importResult.processed} records</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={importing}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
