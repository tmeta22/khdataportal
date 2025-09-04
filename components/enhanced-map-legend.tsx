"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Map } from "lucide-react"

interface MapLegendProps {
  onLayerToggle: (layer: string, enabled: boolean) => void
  layerStates: {
    provinces: boolean
    districts: boolean
    communes: boolean
    villages: boolean
    khan: boolean
    sangkat: boolean
    provinceBoundaries: boolean
    districtBoundaries: boolean
    communeBoundaries: boolean
  }
  statistics: {
    provinces: number
    districts: number
    communes: number
    villages: number
    khan?: number
    sangkat?: number
  }
}

export function EnhancedMapLegend({ onLayerToggle, layerStates, statistics }: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const administrativeLevels = [
    {
      key: "provinces",
      label: "Provinces",
      count: statistics.provinces || 25,
      color: "bg-blue-500",
      description: "First-level administrative divisions",
    },
    {
      key: "districts",
      label: "Districts",
      count: statistics.districts || 159,
      color: "bg-orange-500",
      description: "Second-level administrative divisions",
    },
    {
      key: "khan",
      label: "Khan",
      count: statistics.khan || 14,
      color: "bg-amber-500",
      description: "Urban districts (Phnom Penh Capital)",
    },
    {
      key: "communes",
      label: "Communes",
      count: statistics.communes || 1646,
      color: "bg-green-500",
      description: "Third-level administrative divisions",
    },
    {
      key: "sangkat",
      label: "Sangkat",
      count: statistics.sangkat || 268,
      color: "bg-emerald-500",
      description: "Urban communes (Phnom Penh Capital)",
    },
    {
      key: "villages",
      label: "Villages",
      count: statistics.villages || 14073,
      color: "bg-purple-500",
      description: "Fourth-level administrative divisions",
    },
  ]

  const boundaryLayers = [
    {
      key: "provinceBoundaries",
      label: "Province Boundaries",
      color: "border-blue-500",
      description: "Provincial administrative boundaries",
    },
    {
      key: "districtBoundaries",
      label: "District Boundaries",
      color: "border-orange-500",
      description: "District administrative boundaries",
    },
    {
      key: "communeBoundaries",
      label: "Commune Boundaries",
      color: "border-green-500",
      description: "Commune administrative boundaries",
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="cursor-pointer pb-3" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map Legend
          </div>
          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs defaultValue="administrative" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="administrative" className="text-xs">
                Administrative Levels
              </TabsTrigger>
              <TabsTrigger value="boundaries" className="text-xs">
                Boundaries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="administrative" className="space-y-3 mt-4">
              {administrativeLevels.map((level) => (
                <div key={level.key} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={level.key}
                      checked={layerStates[level.key as keyof typeof layerStates]}
                      onCheckedChange={(checked) => onLayerToggle(level.key, checked as boolean)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-4 h-4 rounded ${level.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{level.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {level.count.toLocaleString()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{level.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="boundaries" className="space-y-3 mt-4">
              {boundaryLayers.map((boundary) => (
                <div key={boundary.key} className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={boundary.key}
                      checked={layerStates[boundary.key as keyof typeof layerStates]}
                      onCheckedChange={(checked) => onLayerToggle(boundary.key, checked as boolean)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-4 h-4 border-2 ${boundary.color} bg-transparent flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{boundary.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{boundary.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}
