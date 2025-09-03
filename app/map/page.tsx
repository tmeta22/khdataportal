"use client"

import { InteractiveMap } from "@/components/interactive-map"
import { Card } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"

export default function MapPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <BackButton />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Interactive Map</h1>
        <p className="text-muted-foreground">
          Explore Cambodia's administrative regions through our interactive map interface
        </p>
      </div>

      {/* Main Map - Full Width */}
      <div className="w-full">
        <Card className="p-0 overflow-hidden">
          <div className="h-[600px]">
            <InteractiveMap />
          </div>
        </Card>
      </div>
    </div>
  )
}
