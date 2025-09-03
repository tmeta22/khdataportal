"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface RecentActivity {
  id: string
  entity_type: string
  entity_id: string
  entity_name_khmer: string
  entity_name_latin: string
  entity_code: string
  viewed_at: string
  session_id: string
}

export function RecentlyViewed() {
  const [recentItems, setRecentItems] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadRecentActivity() {
      try {
        if (typeof window === "undefined") return

        // Get or create session ID
        let sessionId = sessionStorage.getItem("session_id")
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(7)
          sessionStorage.setItem("session_id", sessionId)
        }

        console.log("[v0] Loading recent activity for session:", sessionId)

        // Try to load from database first
        const { data: dbActivity, error } = await supabase
          .from("user_activity")
          .select("*")
          .eq("session_id", sessionId)
          .order("viewed_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("[v0] Error loading from database:", error)
          // Fallback to localStorage
          loadFromLocalStorage()
        } else if (dbActivity && dbActivity.length > 0) {
          console.log("[v0] Loaded from database:", dbActivity.length, "items")
          setRecentItems(dbActivity)
        } else {
          // Try localStorage as fallback
          loadFromLocalStorage()
        }
      } catch (error) {
        console.error("[v0] Error in loadRecentActivity:", error)
        loadFromLocalStorage()
      } finally {
        setLoading(false)
      }
    }

    function loadFromLocalStorage() {
      try {
        if (typeof window === "undefined") return

        const localActivity = JSON.parse(localStorage.getItem("recent_activity") || "[]")
        console.log("[v0] Loaded from localStorage:", localActivity.length, "items")

        // Convert localStorage format to database format
        const convertedActivity = localActivity.map((item: any) => ({
          id: item.id || Math.random().toString(36).substring(7),
          entity_type: item.type || "province",
          entity_id: item.id || "",
          entity_name_khmer: item.name_khmer || "",
          entity_name_latin: item.name || item.name_latin || "",
          entity_code: item.code || "",
          viewed_at: item.viewedAt || new Date().toISOString(),
          session_id: sessionStorage.getItem("session_id") || "",
        }))

        setRecentItems(convertedActivity.slice(0, 10))
      } catch (error) {
        console.error("[v0] Error loading from localStorage:", error)
        setRecentItems([])
      }
    }

    loadRecentActivity()
  }, [supabase])

  const trackActivity = async (entity: {
    type: string
    id: string
    name_latin: string
    name_khmer: string
    code: string
  }) => {
    try {
      if (typeof window === "undefined") return

      const sessionId = sessionStorage.getItem("session_id") || Math.random().toString(36).substring(7)
      sessionStorage.setItem("session_id", sessionId)

      const activityRecord = {
        session_id: sessionId,
        entity_type: entity.type,
        entity_id: entity.id,
        entity_name_khmer: entity.name_khmer,
        entity_name_latin: entity.name_latin,
        entity_code: entity.code,
        viewed_at: new Date().toISOString(),
      }

      // Try to insert into database
      const { error } = await supabase.from("user_activity").insert(activityRecord)

      if (error) {
        console.error("[v0] Error saving to database:", error)
        // Fallback to localStorage
        const localActivity = JSON.parse(localStorage.getItem("recent_activity") || "[]")
        localActivity.unshift({
          ...activityRecord,
          id: Math.random().toString(36).substring(7),
        })
        localStorage.setItem("recent_activity", JSON.stringify(localActivity.slice(0, 10)))
      }

      // Update local state
      setRecentItems((prev) => [
        { ...activityRecord, id: Math.random().toString(36).substring(7) },
        ...prev.filter((item) => item.entity_id !== entity.id).slice(0, 9),
      ])
    } catch (error) {
      console.error("[v0] Error tracking activity:", error)
    }
  }

  useEffect(() => {
    ;(window as any).trackRecentActivity = trackActivity
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const viewed = new Date(dateString)
    const diffMs = now.getTime() - viewed.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getTypeDisplayName = (type: string) => {
    switch (type.toLowerCase()) {
      case "province":
        return "Province"
      case "district":
        return "District"
      case "commune":
        return "Commune"
      case "village":
        return "Village"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recently Viewed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">Loading recent activity...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Recently Viewed</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentItems.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No recent activity. Start exploring administrative regions to see them here.
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item, index) => (
              <div
                key={`${item.session_id}-${item.entity_id}-${index}`}
                className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
              >
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{item.entity_name_latin}</span>
                    <span className="text-xs text-muted-foreground">{item.entity_code}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getTypeDisplayName(item.entity_type)}
                    {item.entity_name_khmer && <span className="font-khmer ml-1">• {item.entity_name_khmer}</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(item.viewed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
