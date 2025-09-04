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

  const matchAdministrativeUnit = async (properties: any, type: string) => {
    const possibleCodeFields = [
      "ADM1_PCODE",
      "ADM2_PCODE",
      "ADM3_PCODE", // Standard PCODE fields
      "code",
      "CODE",
      "ADM_CODE",
      "PCODE",
      "id",
      "ID",
      "pro_code",
      "dis_code",
      "com_code",
      "PROVINCE_CODE",
      "DISTRICT_CODE",
      "COMMUNE_CODE",
    ]
    const possibleNameFields = [
      "ADM1_EN",
      "ADM2_EN",
      "ADM3_EN", // Standard English name fields
      "ADM1_KH",
      "ADM2_KH",
      "ADM3_KH", // Standard Khmer name fields
      "name",
      "NAME",
      "ADM_NAME",
      "NAME_EN",
      "name_en",
      "NAME_KH",
      "name_kh",
      "PROVINCE",
      "DISTRICT",
      "COMMUNE",
      "pro_name",
      "dis_name",
      "com_name",
      "PROVINCE_NAME",
      "DISTRICT_NAME",
      "COMMUNE_NAME",
    ]

    let code = null
    let name = null

    // Try to find code first (more reliable)
    for (const field of possibleCodeFields) {
      if (properties[field] !== undefined && properties[field] !== null && properties[field] !== "") {
        code = properties[field].toString().trim()
        console.log("[v0] Found code field:", field, "=", code)
        break
      }
    }

    // Try to find name
    for (const field of possibleNameFields) {
      if (properties[field] !== undefined && properties[field] !== null && properties[field] !== "") {
        name = properties[field].toString().trim()
        console.log("[v0] Found name field:", field, "=", name)
        break
      }
    }

    if (!code && !name) {
      console.log("[v0] No matching code or name found in properties:", Object.keys(properties))
      return null
    }

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

    const query = supabase.from(tableName).select("id, code, name_latin, name_khmer")

    if (code) {
      // Try exact code match first
      const { data: exactMatch } = await query.eq("code", code).limit(1).single()
      if (exactMatch) {
        console.log(`[v0] Exact code match found for ${type}:`, exactMatch.name_latin)
        return exactMatch
      }

      // Try code as substring
      const { data: codeSubstring } = await supabase
        .from(tableName)
        .select("id, code, name_latin, name_khmer")
        .ilike("code", `%${code}%`)
        .limit(1)
        .single()
      if (codeSubstring) {
        console.log(`[v0] Code substring match found for ${type}:`, codeSubstring.name_latin)
        return codeSubstring
      }
    }

    if (name) {
      // Try exact name match (case insensitive)
      const { data: exactNameMatch } = await supabase
        .from(tableName)
        .select("id, code, name_latin, name_khmer")
        .or(`name_latin.ilike.${name},name_khmer.ilike.${name}`)
        .limit(1)
        .single()
      if (exactNameMatch) {
        console.log(`[v0] Exact name match found for ${type}:`, exactNameMatch.name_latin)
        return exactNameMatch
      }

      // Try fuzzy name matching
      const { data: fuzzyMatches } = await supabase
        .from(tableName)
        .select("id, code, name_latin, name_khmer")
        .or(`name_latin.ilike.%${name}%,name_khmer.ilike.%${name}%`)
        .limit(5)

      if (fuzzyMatches && fuzzyMatches.length > 0) {
        console.log(`[v0] Fuzzy name match found for ${type}:`, fuzzyMatches[0].name_latin)
        return fuzzyMatches[0]
      }
    }

    console.log(`[v0] No match found for ${type} with code: ${code}, name: ${name}`)
    return null
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

      console.log("[v0] Processing", totalFeatures, "boundary features")

      for (let i = 0; i < features.length; i++) {
        const feature = features[i]
        processed++

        try {
          const matchedUnit = await matchAdministrativeUnit(feature.properties, boundaryType)

          if (!matchedUnit) {
            errors++
            errorDetails.push(
              `Feature ${i + 1}: No matching ${boundaryType} found for properties: ${JSON.stringify(feature.properties)}`,
            )
            continue
          }

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

          const { error: insertError } = await supabase.from(boundaryTable).insert({
            [unitIdField]: matchedUnit.id,
            geojson: feature.geometry,
            properties: feature.properties,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
          Import GeoJSON boundary files for provinces, districts, or communes. The system will automatically match
          boundaries with existing administrative units.
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
            <li>• Properties should include administrative code or name</li>
            <li>
              • <strong>Supported code fields:</strong> ADM1_PCODE, ADM2_PCODE, ADM3_PCODE, code, CODE, ADM_CODE, PCODE,
              id, ID, pro_code, dis_code, com_code, PROVINCE_CODE, DISTRICT_CODE, COMMUNE_CODE
            </li>
            <li>
              • <strong>Supported name fields:</strong> ADM1_EN, ADM2_EN, ADM3_EN, ADM1_KH, ADM2_KH, ADM3_KH, name,
              NAME, ADM_NAME, NAME_EN, name_en, NAME_KH, name_kh, PROVINCE, DISTRICT, COMMUNE, pro_name, dis_name,
              com_name, PROVINCE_NAME, DISTRICT_NAME, COMMUNE_NAME
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
