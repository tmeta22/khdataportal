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
import { Upload, MapPin, AlertCircle, CheckCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface BoundaryImportProps {
  onImportComplete?: () => void
}

export function BoundaryImport({ onImportComplete }: BoundaryImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [boundaryType, setBoundaryType] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    processed: number
    imported: number
    skipped: number
    errors: number
    errorDetails: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      console.log("[v0] Boundary file selected:", selectedFile.name, selectedFile.type)

      // Validate file type
      const validTypes = ["application/json", "application/geo+json", "text/plain"]
      const isValidType = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith(".geojson")

      if (!isValidType) {
        setError("Please select a valid GeoJSON file (.geojson or .json)")
        return
      }

      setFile(selectedFile)
      setError(null)
      setResults(null)
    }
  }

  const matchAdministrativeUnit = async (properties: any, type: string) => {
    // Try to match by various possible property names
    const possibleCodeFields = ["code", "CODE", "ADM_CODE", "PCODE", "id", "ID"]
    const possibleNameFields = ["name", "NAME", "ADM_NAME", "NAME_EN", "name_en", "NAME_KH", "name_kh"]

    let code = null
    let name = null

    // Find code
    for (const field of possibleCodeFields) {
      if (properties[field]) {
        code = properties[field].toString()
        break
      }
    }

    // Find name
    for (const field of possibleNameFields) {
      if (properties[field]) {
        name = properties[field].toString()
        break
      }
    }

    if (!code && !name) {
      return null
    }

    // Query the appropriate table
    let tableName = ""
    switch (type) {
      case "province":
        tableName = "provinces"
        break
      case "district":
        tableName = "districts"
        break
      case "commune":
        tableName = "communes"
        break
      default:
        return null
    }

    let query = supabase.from(tableName).select("id, code, name_latin, name_khmer")

    if (code) {
      query = query.eq("code", code)
    } else if (name) {
      query = query.or(`name_latin.ilike.%${name}%,name_khmer.ilike.%${name}%`)
    }

    const { data, error } = await query.limit(1).single()

    if (error || !data) {
      console.log(`[v0] No match found for ${type} with code: ${code}, name: ${name}`)
      return null
    }

    return data
  }

  const handleImport = async () => {
    if (!file || !boundaryType) {
      setError("Please select a file and boundary type")
      return
    }

    setIsImporting(true)
    setProgress(0)
    setError(null)
    setResults(null)

    try {
      console.log("[v0] Starting boundary import for type:", boundaryType)

      // Read and parse GeoJSON file
      const fileContent = await file.text()
      const geoJsonData = JSON.parse(fileContent)

      if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
        throw new Error("Invalid GeoJSON format: missing features array")
      }

      const features = geoJsonData.features
      const totalFeatures = features.length
      let processed = 0
      let imported = 0
      let skipped = 0
      let errors = 0
      const errorDetails: string[] = []

      console.log("[v0] Processing", totalFeatures, "boundary features")

      // Process each feature
      for (let i = 0; i < features.length; i++) {
        const feature = features[i]
        processed++

        try {
          // Match with existing administrative unit
          const matchedUnit = await matchAdministrativeUnit(feature.properties, boundaryType)

          if (!matchedUnit) {
            errors++
            errorDetails.push(
              `Feature ${i + 1}: No matching ${boundaryType} found for properties: ${JSON.stringify(feature.properties)}`,
            )
            continue
          }

          // Check if boundary already exists
          const boundaryTable = `${boundaryType}_boundaries`
          const unitIdField = `${boundaryType}_id`

          const { data: existing } = await supabase
            .from(boundaryTable)
            .select("id")
            .eq(unitIdField, matchedUnit.id)
            .single()

          if (existing) {
            skipped++
            console.log(`[v0] Skipping existing boundary for ${boundaryType}:`, matchedUnit.name_latin)
            continue
          }

          // Insert boundary data
          const { error: insertError } = await supabase.from(boundaryTable).insert({
            [unitIdField]: matchedUnit.id,
            geojson: feature.geometry,
            properties: feature.properties,
          })

          if (insertError) {
            errors++
            errorDetails.push(`Feature ${i + 1}: Database error - ${insertError.message}`)
            console.error("[v0] Insert error:", insertError)
          } else {
            imported++
            console.log(`[v0] Imported boundary for ${boundaryType}:`, matchedUnit.name_latin)
          }
        } catch (featureError) {
          errors++
          errorDetails.push(`Feature ${i + 1}: Processing error - ${featureError}`)
          console.error("[v0] Feature processing error:", featureError)
        }

        // Update progress
        setProgress(Math.round((processed / totalFeatures) * 100))
      }

      setResults({
        processed,
        imported,
        skipped,
        errors,
        errorDetails: errorDetails.slice(0, 10), // Show first 10 errors
      })

      console.log("[v0] Boundary import completed:", { processed, imported, skipped, errors })

      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      console.error("[v0] Boundary import error:", error)
      setError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Import Boundary Data
        </CardTitle>
        <CardDescription>
          Import GeoJSON boundary files for provinces, districts, or communes. The system will automatically match
          boundaries with existing administrative units.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boundary Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="boundary-type">Boundary Type</Label>
          <Select value={boundaryType} onValueChange={setBoundaryType}>
            <SelectTrigger>
              <SelectValue placeholder="Select boundary type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="province">Province Boundaries</SelectItem>
              <SelectItem value="district">District Boundaries</SelectItem>
              <SelectItem value="commune">Commune Boundaries</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="boundary-file">Select GeoJSON File</Label>
          <Input
            id="boundary-file"
            type="file"
            accept=".geojson,.json"
            onChange={handleFileSelect}
            disabled={isImporting}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Import Button */}
        <Button onClick={handleImport} disabled={!file || !boundaryType || isImporting} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? "Importing..." : "Import Boundaries"}
        </Button>

        {/* Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing boundaries...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {results && (
          <Alert variant={results.errors > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  Import completed: {results.imported} imported, {results.skipped} skipped, {results.errors} errors
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

        {/* Format Requirements */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">GeoJSON Format Requirements</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Valid GeoJSON format with features array</li>
            <li>• Each feature should have geometry and properties</li>
            <li>• Properties should include administrative code or name</li>
            <li>• Supported property names: code, CODE, ADM_CODE, PCODE, name, NAME, ADM_NAME</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
