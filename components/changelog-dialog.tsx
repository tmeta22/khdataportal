"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, MapPin, Database, Palette, Bug, Plus } from "lucide-react"

interface ChangelogEntry {
  version: string
  date: string
  type: "feature" | "improvement" | "bugfix"
  title: string
  description: string
  icon: React.ReactNode
}

const changelog: ChangelogEntry[] = [
  {
    version: "3.2.0",
    date: "2025-01-09",
    type: "feature",
    title: "Census Data Integration",
    description:
      "Added comprehensive census data display on Details page with population demographics, household statistics, and data visualization on Explore page for all users.",
    icon: <Database className="w-4 h-4" />,
  },
  {
    version: "3.1.5",
    date: "2025-01-09",
    type: "bugfix",
    title: "Leaflet MIME Type Fix",
    description:
      "Resolved Leaflet loading issues by implementing dynamic CDN imports, ensuring maps load properly across all browsers and environments.",
    icon: <Bug className="w-4 h-4" />,
  },
  {
    version: "3.1.4",
    date: "2025-01-09",
    type: "improvement",
    title: "District Boundary Import",
    description:
      "Enhanced boundary import system to properly handle district-level GeoJSON data with improved matching logic for administrative codes.",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    version: "3.1.3",
    date: "2025-01-09",
    type: "improvement",
    title: "Footer Redesign",
    description:
      "Updated footer layout with improved data source attribution and repositioned support section for better user experience.",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    version: "3.1.2",
    date: "2025-01-08",
    type: "feature",
    title: "Khan & Sangkat Support",
    description:
      "Added full support for Phnom Penh's urban administrative units (Khan and Sangkat) with proper legend integration and map display.",
    icon: <Plus className="w-4 h-4" />,
  },
  {
    version: "3.1.1",
    date: "2025-01-08",
    type: "bugfix",
    title: "Map Controls Enhancement",
    description:
      "Moved map style controls outside overlay area and fixed boundary layer display with proper color coordination.",
    icon: <Bug className="w-4 h-4" />,
  },
  {
    version: "3.1.0",
    date: "2025-01-08",
    type: "feature",
    title: "Advanced Map Legend",
    description:
      "Implemented comprehensive map legend with administrative levels, boundary controls, and real-time statistics display.",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    version: "2.1.0",
    date: "2024-12-19",
    type: "feature",
    title: "GeoJSON Boundary Import",
    description: "Added support for importing administrative boundaries in GeoJSON format with interactive map layers.",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    version: "2.0.5",
    date: "2024-12-19",
    type: "improvement",
    title: "Enhanced Map Legend",
    description:
      "Redesigned map legend with tabbed interface, color-coded administrative levels, and statistics display.",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    version: "2.0.4",
    date: "2024-12-19",
    type: "feature",
    title: "Census Data Import",
    description: "Added Provisional Census 2019 data import with interactive visualizations and chart capabilities.",
    icon: <Database className="w-4 h-4" />,
  },
  {
    version: "2.0.3",
    date: "2024-12-18",
    type: "bugfix",
    title: "Phnom Penh Administrative Support",
    description: "Fixed Khan and Sangkat administrative units display for Phnom Penh capital region.",
    icon: <Bug className="w-4 h-4" />,
  },
  {
    version: "2.0.2",
    date: "2024-12-18",
    type: "improvement",
    title: "Coordinate Import Enhancement",
    description: "Improved coordinate import with field mapping, decimal format support, and bulk operations.",
    icon: <Plus className="w-4 h-4" />,
  },
  {
    version: "2.0.1",
    date: "2024-12-17",
    type: "feature",
    title: "PWA Support",
    description: "Added Progressive Web App functionality with offline support and installation capabilities.",
    icon: <Calendar className="w-4 h-4" />,
  },
]

interface ChangelogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "bg-green-100 text-green-800 border-green-200"
      case "improvement":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "bugfix":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Updates & Changelog
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {changelog.map((entry, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {entry.icon}
                    <Badge variant="outline" className={getTypeColor(entry.type)}>
                      {entry.type}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{entry.title}</h3>
                      <span className="text-xs text-gray-500">v{entry.version}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{entry.description}</p>
                    <span className="text-xs text-gray-400">{entry.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
