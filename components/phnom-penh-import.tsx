"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ImportResult {
  processed: number
  imported: number
  updated: number
  errors: number
}

export function PhnomPenhImport() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const supabase = createClient()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setResult(null)
      setErrors([])
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
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
    setProgress(0)
    setErrors([])

    try {
      const text = await file.text()
      const data = parseCSV(text)

      console.log("[v0] Phnom Penh import data:", data.slice(0, 3))

      let processed = 0
      let imported = 0
      let updated = 0
      const importErrors: string[] = []

      for (const row of data) {
        try {
          const zipCode = row["Zip Code"] || row["zip_code"]
          const name = row["Name"] || row["name"]
          const longitude = Number.parseFloat(row["Longitude"] || row["longitude"] || row["decimal_longitude"])
          const latitude = Number.parseFloat(row["Latitude"] || row["latitude"] || row["decimal_latitude"])
          const locationType = row["Type of location"] || row["type"] || row["Type"]

          if (!zipCode || !name || isNaN(longitude) || isNaN(latitude)) {
            importErrors.push(`Row ${processed + 1}: Missing required fields`)
            processed++
            continue
          }

          // Determine which table to insert into based on location type
          let tableName = ""
          let additionalData = {}

          switch (locationType.toLowerCase()) {
            case "capital city":
              tableName = "provinces"
              additionalData = {
                code: zipCode,
                name_latin: name,
                name_khmer: name,
                type: "Capital",
              }
              break
            case "khan":
              tableName = "khan"
              additionalData = {
                code: zipCode,
                name_latin: name,
                name_khmer: name,
                province_id: "12", // Phnom Penh province ID
              }
              break
            case "sangkat":
              tableName = "sangkat"
              additionalData = {
                code: zipCode,
                name_latin: name,
                name_khmer: name,
                province_id: "12", // Phnom Penh province ID
              }
              break
            case "village":
              tableName = "villages"
              additionalData = {
                code: zipCode,
                name_latin: name,
                name_khmer: name,
              }
              break
            default:
              importErrors.push(`Row ${processed + 1}: Unknown location type: ${locationType}`)
              processed++
              continue
          }

          // Try to update existing record first, then insert if not found
          const { data: existingData, error: selectError } = await supabase
            .from(tableName)
            .select("id")
            .eq("code", zipCode)
            .single()

          if (existingData) {
            // Update existing record
            const { error: updateError } = await supabase
              .from(tableName)
              .update({
                latitude,
                longitude,
                ...additionalData,
              })
              .eq("id", existingData.id)

            if (updateError) {
              importErrors.push(`Row ${processed + 1}: Update error - ${updateError.message}`)
            } else {
              updated++
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase.from(tableName).insert({
              latitude,
              longitude,
              ...additionalData,
            })

            if (insertError) {
              importErrors.push(`Row ${processed + 1}: Insert error - ${insertError.message}`)
            } else {
              imported++
            }
          }

          processed++
          setProgress((processed / data.length) * 100)
        } catch (error) {
          importErrors.push(`Row ${processed + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
          processed++
        }
      }

      setResult({
        processed,
        imported,
        updated,
        errors: importErrors.length,
      })
      setErrors(importErrors.slice(0, 10)) // Show first 10 errors

      console.log("[v0] Phnom Penh import completed:", { processed, imported, updated, errors: importErrors.length })
    } catch (error) {
      console.error("[v0] Import error:", error)
      setErrors([error instanceof Error ? error.message : "Unknown error occurred"])
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Phnom Penh Administrative Data Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Select CSV File (1043 Phnom Penh Records)</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
          <p className="text-sm text-muted-foreground">
            Expected columns: Zip Code, Name, Longitude, Latitude, Type of location
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileText className="w-4 h-4" />
            <span className="text-sm">{file.name}</span>
            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Importing Phnom Penh data...</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {result && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Import completed: {result.imported} imported, {result.updated} updated, {result.errors} errors
            </AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>Import errors ({errors.length} shown):</p>
                {errors.map((error, index) => (
                  <p key={index} className="text-xs font-mono">
                    {error}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleImport} disabled={!file || importing} className="w-full">
          {importing ? "Importing..." : "Import Phnom Penh Data"}
        </Button>
      </CardContent>
    </Card>
  )
}
