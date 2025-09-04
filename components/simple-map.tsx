"use client"

import type React from "react"

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

interface SimpleMapProps {
  provinces: Province[]
  selectedProvince?: string
  onLocationSelect?: (location: { type: string; name: string; code: string; id?: string }) => void
  onZoomChange?: (zoom: number) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

export default function SimpleMap({
  provinces,
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

  const handleProvinceClick = (province: Province) => {
    onLocationSelect?.({
      type: "province",
      name: province.name_latin,
      code: province.code,
      id: province.id,
    })
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3)
    setZoom(newZoom)
    onZoomChange?.(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.5)
    setZoom(newZoom)
    onZoomChange?.(newZoom)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="w-full h-full relative bg-blue-50 rounded-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button variant="secondary" size="sm" onClick={handleZoomIn} className="bg-white/90 backdrop-blur-sm">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleZoomOut} className="bg-white/90 backdrop-blur-sm">
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

          {/* Province markers */}
          {provinces.map((province) => {
            if (!province.latitude || !province.longitude) return null

            const { x, y } = latLngToSVG(province.latitude, province.longitude)
            const isSelected = selectedProvince === province.id || selectedProvince === province.code

            return (
              <g key={province.id}>
                {/* Province marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 8 : 6}
                  fill={isSelected ? "#ef4444" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-7 transition-all duration-200"
                  onClick={() => handleProvinceClick(province)}
                />

                {/* Province label */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 pointer-events-none select-none"
                  style={{ fontSize: "10px" }}
                >
                  {province.name_latin}
                </text>

                {/* Tooltip on hover */}
                <title>
                  {province.name_latin} ({province.name_khmer}){"\n"}Code: {province.code}
                  {"\n"}Coordinates: {province.latitude.toFixed(4)}, {province.longitude.toFixed(4)}
                </title>
              </g>
            )
          })}

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
        <div>Provinces: {provinces.length}</div>
        <div>Click markers to select provinces</div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-500">
        Cambodia Administrative Map
      </div>
    </div>
  )
}
