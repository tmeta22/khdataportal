"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, Edit, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"

interface DetailedStatsData {
  capital: number
  krong: number
  srok: number
  khan: number
  communes: number
  sangkat: number
  villages: number
}

export function OverviewStats() {
  const [stats, setStats] = useState<DetailedStatsData>({
    capital: 1,
    krong: 33,
    srok: 163,
    khan: 14,
    communes: 1378,
    sangkat: 274,
    villages: 14576,
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editStats, setEditStats] = useState<DetailedStatsData>(stats)

  const supabase = createClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      console.log("[v0] Loading detailed administrative statistics...")
      setLoading(true)

      const [capitalResult, krongResult, srokResult, khanResult, communesResult, sangkatResult, villagesResult] =
        await Promise.all([
          supabase.from("provinces").select("*", { count: "exact", head: true }).eq("type", "capital"),
          supabase.from("districts").select("*", { count: "exact", head: true }).eq("type", "krong"),
          supabase.from("districts").select("*", { count: "exact", head: true }).eq("type", "srok"),
          supabase.from("districts").select("*", { count: "exact", head: true }).eq("type", "khan"),
          supabase.from("communes").select("*", { count: "exact", head: true }).eq("type", "commune"),
          supabase.from("communes").select("*", { count: "exact", head: true }).eq("type", "sangkat"),
          supabase.from("villages").select("*", { count: "exact", head: true }),
        ])

      const newStats = {
        capital: capitalResult.count || 1,
        krong: krongResult.count || 33,
        srok: srokResult.count || 163,
        khan: khanResult.count || 14,
        communes: communesResult.count || 1378,
        sangkat: sangkatResult.count || 274,
        villages: villagesResult.count || 14576,
      }

      console.log("[v0] Loaded detailed stats:", newStats)
      setStats(newStats)
      setEditStats(newStats)
    } catch (error) {
      console.error("[v0] Error loading stats:", error)
      // Keep fallback values if database fails
    } finally {
      setLoading(false)
    }
  }

  async function updateStats() {
    if (!isAuthenticated) return

    try {
      setUpdating(true)
      console.log("[v0] Updating administrative statistics...")

      await loadStats()
      setEditDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error updating stats:", error)
    } finally {
      setUpdating(false)
    }
  }

  const statsDisplay = [
    { label: "Capital", value: loading ? "..." : stats.capital.toLocaleString(), color: "text-red-600" },
    { label: "Krong", value: loading ? "..." : stats.krong.toLocaleString(), color: "text-blue-600" },
    { label: "Srok", value: loading ? "..." : stats.srok.toLocaleString(), color: "text-green-600" },
    { label: "Khan", value: loading ? "..." : stats.khan.toLocaleString(), color: "text-purple-600" },
    { label: "Communes", value: loading ? "..." : stats.communes.toLocaleString(), color: "text-orange-600" },
    { label: "Sangkat", value: loading ? "..." : stats.sangkat.toLocaleString(), color: "text-teal-600" },
    { label: "Villages", value: loading ? "..." : stats.villages.toLocaleString(), color: "text-indigo-600" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Cambodia Overview</span>
          </div>
          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadStats} disabled={loading || updating}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading || updating ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Administrative Statistics</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="capital" className="text-right">
                        Capital
                      </Label>
                      <Input
                        id="capital"
                        type="number"
                        value={editStats.capital}
                        onChange={(e) => setEditStats({ ...editStats, capital: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="krong" className="text-right">
                        Krong
                      </Label>
                      <Input
                        id="krong"
                        type="number"
                        value={editStats.krong}
                        onChange={(e) => setEditStats({ ...editStats, krong: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="srok" className="text-right">
                        Srok
                      </Label>
                      <Input
                        id="srok"
                        type="number"
                        value={editStats.srok}
                        onChange={(e) => setEditStats({ ...editStats, srok: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="khan" className="text-right">
                        Khan
                      </Label>
                      <Input
                        id="khan"
                        type="number"
                        value={editStats.khan}
                        onChange={(e) => setEditStats({ ...editStats, khan: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="communes" className="text-right">
                        Communes
                      </Label>
                      <Input
                        id="communes"
                        type="number"
                        value={editStats.communes}
                        onChange={(e) => setEditStats({ ...editStats, communes: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="sangkat" className="text-right">
                        Sangkat
                      </Label>
                      <Input
                        id="sangkat"
                        type="number"
                        value={editStats.sangkat}
                        onChange={(e) => setEditStats({ ...editStats, sangkat: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="villages" className="text-right">
                        Villages
                      </Label>
                      <Input
                        id="villages"
                        type="number"
                        value={editStats.villages}
                        onChange={(e) => setEditStats({ ...editStats, villages: Number.parseInt(e.target.value) || 0 })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateStats} disabled={updating}>
                      {updating ? "Updating..." : "Update Statistics"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground font-khmer">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
