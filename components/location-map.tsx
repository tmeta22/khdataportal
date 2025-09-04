"use client"

import SimpleLocationMap from "./simple-location-map"

interface Province {
  id: string
  name_latin: string
  name_khmer: string
  latitude: number
  longitude: number
}

interface LocationMapProps {
  province: Province
}

export default function LocationMap({ province }: LocationMapProps) {
  return <SimpleLocationMap province={province} />
}
