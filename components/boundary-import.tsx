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
  const [preview, setPreview] = useState<any>(null)

  const supabase = createClientComponentClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      console.log("[v0] Boundary file selected:", selectedFile.name, selectedFile.type)

      const validTypes = ["application/json", "application/geo+json", "text/plain"]
      const isValidType = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith(".geojson")

      if (!isValidType) {
        setError("Please select a valid GeoJSON file (.geojson or .json)")
        return
      }

      setFile(selectedFile)
      setError(null)
      setResults(null)

      try {
        const fileContent = await selectedFile.text()
        const geoJsonData = JSON.parse(fileContent)

        if (geoJsonData.features && geoJsonData.features.length > 0) {
          const sampleFeature = geoJsonData.features[0]
          setPreview({
            totalFeatures: geoJsonData.features.length,
            sampleProperties: sampleFeature.properties,
            geometryType: sampleFeature.geometry?.type,
          })
          console.log("[v0] GeoJSON preview:", {
            features: geoJsonData.features.length,
            sampleProperties: sampleFeature.properties,
          })
        }
      } catch (previewError) {
        console.error("[v0] Preview error:", previewError)
        setPreview(null)
      }
    }
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

      console.log("[v0] Processing", totalFeatures, "boundary features for map display")

      for (let i = 0; i < features.length; i++) {
        const feature = features[i]
        processed++

        try {
          // Extract identifying information from properties
          const properties = feature.properties || {}

          // Try to extract code
          const codeFields = ["ADM2_PCODE", "ADM1_PCODE", "ADM3_PCODE", "code", "CODE", "PCODE", "id", "ID"]
          let code = null
          for (const field of codeFields) {
            if (properties[field] !== undefined && properties[field] !== null && properties[field] !== "") {
              code = properties[field].toString().trim()
              break
            }
          }

          // Try to extract name
          const nameFields = [
            "ADM2_EN",
            "ADM1_EN",
            "ADM3_EN",
            "name",
            "NAME",
            "NAME_EN",
            "DISTRICT",
            "PROVINCE",
            "COMMUNE",
          ]
          let name = null
          for (const field of nameFields) {
            if (properties[field] !== undefined && properties[field] !== null && properties[field] !== "") {
              name = properties[field].toString().trim()
              break
            }
          }

          // Create a unique identifier for this boundary
          const boundaryId = code || name || `feature_${i + 1}`

          if (!boundaryId) {
            errors++
            errorDetails.push(`Feature ${i + 1}: No identifying code or name found`)
            continue
          }

          console.log(`[v0] Processing boundary: ${boundaryId} (${name || "unnamed"})`)

          // Use a generic boundaries table for map display
          const boundaryTable = "map_boundaries"

          // Check if this boundary already exists
          const { data: existing } = await supabase
            .from(boundaryTable)
            .select("id")
            .eq("boundary_id", boundaryId)
            .eq("boundary_type", boundaryType)
            .single()

          if (existing) {
            skipped++
            console.log(`[v0] Skipping existing boundary: ${boundaryId}`)
            continue
          }

          // Insert boundary for map display
          const { error: insertError } = await supabase.from(boundaryTable).insert({
            boundary_id: boundaryId,
            boundary_type: boundaryType,
            name: name || boundaryId,
            code: code,
            geojson: feature.geometry,
            properties: properties,
          })

          if (insertError) {
            errors++
            errorDetails.push(`Feature ${i + 1}: Database error - ${insertError.message}`)
            console.error("[v0] Insert error:", insertError)
          } else {
            imported++
            console.log(`[v0] Imported boundary for map display: ${boundaryId}`)
          }
        } catch (featureError) {
          errors++
          errorDetails.push(`Feature ${i + 1}: Processing error - ${featureError}`)
          console.error("[v0] Feature processing error:", featureError)
        }

        setProgress(Math.round((processed / totalFeatures) * 100))
      }

      setResults({
        processed,
        imported,
        skipped,
        errors,
        errorDetails: errorDetails.slice(0, 10),
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
          Import GeoJSON boundary files for map visualization. Boundaries will be displayed on maps regardless of
          existing administrative data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {preview && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">GeoJSON Preview</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Total Features:</strong> {preview.totalFeatures}
              </p>
              <p>
                <strong>Geometry Type:</strong> {preview.geometryType}
              </p>
              <div>
                <strong>Sample Properties:</strong>
                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(preview.sampleProperties, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleImport} disabled={!file || !boundaryType || isImporting} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? "Importing..." : "Import Boundaries"}
        </Button>

        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing boundaries...</span>
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

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">GeoJSON Format Requirements</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Valid GeoJSON format with features array</li>
            <li>• Each feature should have geometry and properties</li>
            <li>• Properties should include identifying code or name for labeling</li>
            <li>• Boundaries will be imported for map visualization only</li>
            <li>• No matching with existing administrative data required</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
