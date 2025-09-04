"use client"

import { useRef } from "react"

interface Province {
  id: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface SimpleLocationMapProps {
  province: Province
}

export default function SimpleLocationMap({ province }: SimpleLocationMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Cambodia bounds
  const cambodiaBounds = {
    north: 14.7,
    south: 10.0,
    east: 107.6,
    west: 102.3,
  }

  const mapWidth = 400
  const mapHeight = 300

  // Convert lat/lng to SVG coordinates
  const latLngToSVG = (lat: number, lng: number) => {
    const x = ((lng - cambodiaBounds.west) / (cambodiaBounds.east - cambodiaBounds.west)) * mapWidth
    const y = ((cambodiaBounds.north - lat) / (cambodiaBounds.north - cambodiaBounds.south)) * mapHeight
    return { x, y }
  }

  const { x, y } = latLngToSVG(province.latitude, province.longitude)

  return (
    <div className="w-full h-full bg-blue-50 rounded-lg overflow-hidden border">
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full">
        {/* Cambodia outline (simplified) */}
        <path
          d="M60 80 L80 60 L120 56 L160 64 L200 72 L240 80 L260 100 L272 120 L268 160 L260 180 L240 192 L200 200 L160 196 L120 192 L80 184 L60 160 Z"
          fill="#e0f2fe"
          stroke="#0369a1"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Province marker */}
        <circle cx={x} cy={y} r="8" fill="#3b82f6" stroke="white" strokeWidth="2" />

        {/* Pulsing animation */}
        <circle cx={x} cy={y} r="8" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6">
          <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Province label */}
        <text
          x={x}
          y={y - 15}
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-700"
          style={{ fontSize: "12px" }}
        >
          {province.name_latin}
        </text>

        {/* Coordinates */}
        <text x={x} y={y + 25} textAnchor="middle" className="text-xs fill-gray-500" style={{ fontSize: "10px" }}>
          {province.latitude.toFixed(4)}, {province.longitude.toFixed(4)}
        </text>
      </svg>

      {/* Province info overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded p-2 text-xs">
        <div className="font-semibold">{province.name_latin}</div>
        <div className="text-gray-600 font-khmer">{province.name_khmer}</div>
      </div>
    </div>
  )
}
