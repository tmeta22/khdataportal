"use client"

import { useState, useEffect } from "react"
import { Calendar, FileText, Users, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Update {
  id: string
  type: string
  title: string
  description: string
  date: string
  province_id?: string
}

interface RecentUpdatesProps {
  provinceId?: string
}

const RecentUpdates = ({ provinceId }: RecentUpdatesProps) => {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRecentUpdates()
  }, [provinceId])

  const loadRecentUpdates = async () => {
    try {
      console.log("[v0] Loading recent updates for province:", provinceId)

      // Try to load from database first
      let query = supabase.from("recent_updates").select("*").order("date", { ascending: false }).limit(5)

      if (provinceId) {
        query = query.eq("province_id", provinceId)
      }

      const { data: dbUpdates, error } = await query

      if (error) {
        console.error("[v0] Error loading updates from database:", error)
        // Fallback to mock data
        loadMockUpdates()
      } else if (dbUpdates && dbUpdates.length > 0) {
        console.log("[v0] Loaded updates from database:", dbUpdates.length)
        setUpdates(dbUpdates)
      } else {
        // Load mock data if no database updates
        loadMockUpdates()
      }
    } catch (error) {
      console.error("[v0] Error loading recent updates:", error)
      loadMockUpdates()
    } finally {
      setLoading(false)
    }
  }

  const loadMockUpdates = () => {
    const mockUpdates: Update[] = [
      {
        id: "1",
        type: "administrative",
        title: "Administrative boundary adjustments completed",
        description: "Updated administrative boundaries based on latest government decree",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        province_id: provinceId,
      },
      {
        id: "2",
        type: "demographic",
        title: "Population census data updated",
        description: "Latest population figures from 2024 census incorporated",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        province_id: provinceId,
      },
      {
        id: "3",
        type: "geographic",
        title: "New sub-district formations approved",
        description: "Three new sub-districts officially recognized by Ministry of Interior",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        province_id: provinceId,
      },
      {
        id: "4",
        type: "infrastructure",
        title: "Infrastructure development projects initiated",
        description: "New road construction and public facility improvements",
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        province_id: provinceId,
      },
    ]

    console.log("[v0] Loaded mock updates:", mockUpdates.length)
    setUpdates(mockUpdates)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "administrative":
        return <FileText className="w-4 h-4 text-blue-600" />
      case "demographic":
        return <Users className="w-4 h-4 text-green-600" />
      case "geographic":
        return <MapPin className="w-4 h-4 text-purple-600" />
      case "infrastructure":
        return <Calendar className="w-4 h-4 text-orange-600" />
      default:
        return <Calendar className="w-4 h-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-4 h-4 bg-muted rounded mt-1" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded mb-1" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {updates.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">No recent updates available.</div>
      ) : (
        updates.map((update) => (
          <div key={update.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
            {getUpdateIcon(update.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{update.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(update.date)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default RecentUpdates
