"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Trash2, AlertTriangle, RefreshCw, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface BulkManagerProps {
  onDataChange?: () => void
}

export function PhnomPenhBulkManager({ onDataChange }: BulkManagerProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [deleteStatus, setDeleteStatus] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const handleBulkDelete = async () => {
    if (!confirm("Are you sure you want to delete ALL Phnom Penh administrative data? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setDeleteProgress(0)
    setError(null)
    setSuccess(null)

    try {
      console.log("[v0] Starting bulk delete for Phnom Penh...")

      // Step 1: Delete villages in Phnom Penh (through communes and sangkat)
      setDeleteStatus("Deleting villages...")
      setDeleteProgress(20)

      const { error: villagesError } = await supabase
        .from("villages")
        .delete()
        .or(
          "commune_id.in.(select id from communes where province_id = (select id from provinces where name_en = 'Phnom Penh Capital')),commune_id.in.(select id from sangkat where province_id = (select id from provinces where name_en = 'Phnom Penh Capital'))",
        )

      if (villagesError) throw villagesError

      // Step 2: Delete sangkat
      setDeleteStatus("Deleting sangkat...")
      setDeleteProgress(40)

      const { error: sangkatError } = await supabase
        .from("sangkat")
        .delete()
        .eq("province_id", "(select id from provinces where name_en = 'Phnom Penh Capital')")

      if (sangkatError) throw sangkatError

      // Step 3: Delete khan
      setDeleteStatus("Deleting khan...")
      setDeleteProgress(60)

      const { error: khanError } = await supabase
        .from("khan")
        .delete()
        .eq("province_id", "(select id from provinces where name_en = 'Phnom Penh Capital')")

      if (khanError) throw khanError

      // Step 4: Delete communes
      setDeleteStatus("Deleting communes...")
      setDeleteProgress(80)

      const { error: communesError } = await supabase
        .from("communes")
        .delete()
        .eq("province_id", "(select id from provinces where name_en = 'Phnom Penh Capital')")

      if (communesError) throw communesError

      // Step 5: Clear coordinates for Phnom Penh province
      setDeleteStatus("Clearing province coordinates...")
      setDeleteProgress(90)

      const { error: provinceError } = await supabase
        .from("provinces")
        .update({ latitude: null, longitude: null })
        .eq("name_en", "Phnom Penh Capital")

      if (provinceError) throw provinceError

      setDeleteProgress(100)
      setDeleteStatus("Bulk delete completed successfully!")
      setSuccess("All Phnom Penh administrative data has been deleted. You can now import fresh data.")

      console.log("[v0] Bulk delete completed successfully")

      if (onDataChange) {
        onDataChange()
      }
    } catch (error: any) {
      console.error("[v0] Bulk delete error:", error)
      setError(`Failed to delete Phnom Penh data: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetCoordinates = async () => {
    if (!confirm("Reset all coordinate data for Phnom Penh administrative units?")) {
      return
    }

    try {
      setError(null)
      setSuccess(null)

      // Reset coordinates for all Phnom Penh administrative levels
      const updates = [
        supabase.from("provinces").update({ latitude: null, longitude: null }).eq("name_en", "Phnom Penh Capital"),
        supabase
          .from("khan")
          .update({ latitude: null, longitude: null })
          .eq("province_id", "(select id from provinces where name_en = 'Phnom Penh Capital')"),
        supabase
          .from("sangkat")
          .update({ latitude: null, longitude: null })
          .eq("province_id", "(select id from provinces where name_en = 'Phnom Penh Capital')"),
        supabase
          .from("villages")
          .update({ latitude: null, longitude: null })
          .or(
            "commune_id.in.(select id from communes where province_id = (select id from provinces where name_en = 'Phnom Penh Capital')),commune_id.in.(select id from sangkat where province_id = (select id from provinces where name_en = 'Phnom Penh Capital'))",
          ),
      ]

      await Promise.all(updates)
      setSuccess("Coordinates reset successfully for all Phnom Penh administrative units.")

      if (onDataChange) {
        onDataChange()
      }
    } catch (error: any) {
      console.error("[v0] Reset coordinates error:", error)
      setError(`Failed to reset coordinates: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Phnom Penh Bulk Data Management
          </CardTitle>
          <CardDescription>
            Manage Phnom Penh administrative data in bulk. Use these tools to clean up data before importing fresh
            coordinates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isDeleting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{deleteStatus}</span>
                <span>{deleteProgress}%</span>
              </div>
              <Progress value={deleteProgress} className="w-full" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleBulkDelete} disabled={isDeleting} variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete All Phnom Penh Data"}
            </Button>

            <Button
              onClick={handleResetCoordinates}
              disabled={isDeleting}
              variant="outline"
              className="w-full bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Coordinates Only
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Delete All:</strong> Removes all Khan, Sangkat, Villages, and coordinates for Phnom Penh
            </p>
            <p>
              <strong>Reset Coordinates:</strong> Keeps administrative structure but clears coordinate data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
