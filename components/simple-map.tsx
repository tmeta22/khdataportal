"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"

interface Province {
  id: string
  code: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface District {
  id: string
  code: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface Commune {
  id: string
  code: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface Village {
  id: string
  code: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface SimpleMapProps {
  provinces: Province[]
  districts?: District[]
  communes?: Commune[]
  villages?: Village[]
  khan?: any[]
  sangkat?: any[]
  boundaries?: any[]
  layerStates?: {
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
  selectedProvince?: string
  onLocationSelect?: (location: { type: string; name: string; code: string; id?: string }) => void
  onZoomChange?: (zoom: number) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

export default function SimpleMap({
  provinces,
  districts = [],
  communes = [],
  villages = [],
  khan = [],
  sangkat = [],
  boundaries = [],
  layerStates = {
    provinces: true,
    districts: false,
    communes: false,
    villages: false,
    khan: false,
    sangkat: false,
    provinceBoundaries: false,
    districtBoundaries: false,
    communeBoundaries: false,
  },
  selectedProvince,
  onLocationSelect,
  onZoomChange,
  isFullscreen = false,
  onFullscreenToggle,
}: SimpleMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Cambodia bounds: approximately 10°N to 14.7°N, 102.3°E to 107.6°E
  const cambodiaBounds = {
    north: 14.7,
    south: 10.0,
    east: 107.6,
    west: 102.3,
  }

  const mapWidth = 800
  const mapHeight = 600

  // Convert lat/lng to SVG coordinates
  const latLngToSVG = (lat: number, lng: number) => {
    const x = ((lng - cambodiaBounds.west) / (cambodiaBounds.east - cambodiaBounds.west)) * mapWidth
    const y = ((cambodiaBounds.north - lat) / (cambodiaBounds.north - cambodiaBounds.south)) * mapHeight
    return { x, y }
  }

  const handleLocationClick = (location: any, type: string) => {
    onLocationSelect?.({
      type,
      name: location.name_latin,
      code: location.code,
      id: location.id,
    })
    console.log("[v0] Location selected from map:", { type, name: location.name_latin, code: location.code })
  }

  const getMarkerColor = (type: string, isSelected: boolean) => {
    if (isSelected) return "#ef4444" // Red for selected

    switch (type) {
      case "province":
        return "#3b82f6" // Blue
      case "district":
      case "khan":
        return "#f97316" // Orange
      case "commune":
      case "sangkat":
        return "#22c55e" // Green
      case "village":
        return "#a855f7" // Purple
      default:
        return "#6b7280" // Gray
    }
  }

  const renderMarkers = () => {
    const markers = []

    // Province markers
    if (layerStates.provinces) {
      provinces.forEach((province) => {
        if (!province.latitude || !province.longitude) return

        const { x, y } = latLngToSVG(province.latitude, province.longitude)
        const isSelected = selectedProvince === province.id || selectedProvince === province.code

        markers.push(
          <g key={`province-${province.id}`}>
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 8 : 6}
              fill={getMarkerColor("province", isSelected)}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:r-7 transition-all duration-200"
              onClick={() => handleLocationClick(province, "province")}
            />
            <text
              x={x}
              y={y - 12}
              textAnchor="middle"
              className="text-xs font-medium fill-gray-700 pointer-events-none select-none"
              style={{ fontSize: "10px" }}
            >
              {province.name_latin}
            </text>
            <title>
              Province: {province.name_latin} ({province.name_khmer}){"\n"}Code: {province.code}
              {"\n"}Coordinates: {province.latitude.toFixed(4)}, {province.longitude.toFixed(4)}
            </title>
          </g>,
        )
      })
    }

    // District markers
    if (layerStates.districts) {
      districts.forEach((district) => {
        if (!district.latitude || !district.longitude) return

        const { x, y } = latLngToSVG(district.latitude, district.longitude)

        markers.push(
          <g key={`district-${district.id}`}>
            <circle
              cx={x}
              cy={y}
              r={5}
              fill={getMarkerColor("district", false)}
              stroke="white"
              strokeWidth="1"
              className="cursor-pointer hover:r-6 transition-all duration-200"
              onClick={() => handleLocationClick(district, "district")}
            />
            <title>
              District: {district.name_latin} ({district.name_khmer}){"\n"}Code: {district.code}
              {"\n"}Coordinates: {district.latitude.toFixed(4)}, {district.longitude.toFixed(4)}
            </title>
          </g>,
        )
      })
    }

    // Khan markers (Phnom Penh urban districts)
    if (layerStates.khan) {
      khan.forEach((k) => {
        if (!k.latitude || !k.longitude) return

        const { x, y } = latLngToSVG(k.latitude, k.longitude)

        markers.push(
          <g key={`khan-${k.id}`}>
            <circle
              cx={x}
              cy={y}
              r={5}
              fill={getMarkerColor("khan", false)}
              stroke="white"
              strokeWidth="1"
              className="cursor-pointer hover:r-6 transition-all duration-200"
              onClick={() => handleLocationClick(k, "khan")}
            />
            <title>
              Khan: {k.name_latin} ({k.name_khmer}){"\n"}Code: {k.code}
              {"\n"}Coordinates: {k.latitude.toFixed(4)}, {k.longitude.toFixed(4)}
            </title>
          </g>,
        )
      })
    }

    // Commune markers
    if (layerStates.communes) {
      communes.forEach((commune) => {
        if (!commune.latitude || !commune.longitude) return

        const { x, y } = latLngToSVG(commune.latitude, commune.longitude)

        markers.push(
          <g key={`commune-${commune.id}`}>
            <circle
              cx={x}
              cy={y}
              r={4}
              fill={getMarkerColor("commune", false)}
              stroke="white"
              strokeWidth="1"
              className="cursor-pointer hover:r-5 transition-all duration-200"
              onClick={() => handleLocationClick(commune, "commune")}
            />
            <title>
              Commune: {commune.name_latin} ({commune.name_khmer}){"\n"}Code: {commune.code}
              {"\n"}Coordinates: {commune.latitude.toFixed(4)}, {commune.longitude.toFixed(4)}
            </title>
          </g>,
        )
      })
    }

    // Sangkat markers (Phnom Penh urban communes)
    if (layerStates.sangkat) {
      sangkat.forEach((s) => {
        if (!s.latitude || !s.longitude) return

        const { x, y } = latLngToSVG(s.latitude, s.longitude)

        markers.push(
          <g key={`sangkat-${s.id}`}>
            <circle
              cx={x}
              cy={y}
              r={4}
              fill={getMarkerColor("sangkat", false)}
              stroke="white"
              strokeWidth="1"
              className="cursor-pointer hover:r-5 transition-all duration-200"
              onClick={() => handleLocationClick(s, "sangkat")}
            />
            <title>
              Sangkat: {s.name_latin} ({s.name_khmer}){"\n"}Code: {s.code}
              {"\n"}Coordinates: {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
            </title>
          </g>,
        )
      })
    }

    // Village markers
    if (layerStates.villages) {
      villages.forEach((village) => {
        if (!village.latitude || !village.longitude) return

        const { x, y } = latLngToSVG(village.latitude, village.longitude)

        markers.push(
          <g key={`village-${village.id}`}>
            <circle
              cx={x}
              cy={y}
              r={3}
              fill={getMarkerColor("village", false)}
              stroke="white"
              strokeWidth="1"
              className="cursor-pointer hover:r-4 transition-all duration-200"
              onClick={() => handleLocationClick(village, "village")}
            />
            <title>
              Village: {village.name_latin} ({village.name_khmer}){"\n"}Code: {village.code}
              {"\n"}Coordinates: {village.latitude.toFixed(4)}, {village.longitude.toFixed(4)}
            </title>
          </g>,
        )
      })
    }

    return markers
  }

  return (
    <div className="w-full h-full relative bg-blue-50 rounded-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        {onFullscreenToggle && (
          <Button variant="secondary" size="sm" onClick={onFullscreenToggle} className="bg-white/90 backdrop-blur-sm">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Map Container */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          setIsDragging(true)
          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            setPan({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y,
            })
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
          }}
        >
          {/* Cambodia outline (simplified) */}
          <path
            d="M150 200 L200 150 L300 140 L400 160 L500 180 L600 200 L650 250 L680 300 L670 400 L650 450 L600 480 L500 500 L400 490 L300 480 L200 460 L150 400 Z"
            fill="#e0f2fe"
            stroke="#0369a1"
            strokeWidth="2"
            opacity="0.3"
          />

          {renderMarkers()}

          {/* Selected province highlight */}
          {selectedProvince &&
            (() => {
              const selected = provinces.find((p) => p.id === selectedProvince || p.code === selectedProvince)
              if (!selected || !selected.latitude || !selected.longitude) return null

              const { x, y } = latLngToSVG(selected.latitude, selected.longitude)
              return (
                <g>
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.8"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from={`0 ${x} ${y}`}
                      to={`360 ${x} ${y}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )
            })()}
        </svg>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-600">
        <div>Zoom: {zoom.toFixed(1)}x</div>
        <div>Visible Layers: {Object.values(layerStates).filter(Boolean).length}</div>
        <div>Click markers to select locations</div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-500">
        Cambodia Administrative Map
      </div>
    </div>
  )
}
