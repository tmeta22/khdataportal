"use client"

import { MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AdministrativeSelectorProps {
  selectedProvince: string
  selectedDistrict: string
  selectedCommune: string
  selectedVillage: string
  onProvinceChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onCommuneChange: (value: string) => void
  onVillageChange: (value: string) => void
}

interface Province {
  id: string
  code: string
  name_khmer: string
  name_latin: string
}

interface District {
  id: string
  code: string
  name_khmer: string
  name_latin: string
  province_id: string
}

interface Commune {
  id: string
  code: string
  name_khmer: string
  name_latin: string
  district_id: string
}

interface Village {
  id: string
  code: string
  name_khmer: string
  name_latin: string
  commune_id: string
}

export function AdministrativeSelector({
  selectedProvince,
  selectedDistrict,
  selectedCommune,
  selectedVillage,
  onProvinceChange,
  onDistrictChange,
  onCommuneChange,
  onVillageChange,
}: AdministrativeSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadProvinces() {
      try {
        const { data, error } = await supabase.from("provinces").select("*").order("name_latin")

        if (error) {
          console.error("[v0] Error loading provinces:", error)
          // Fallback to sample data if database is empty
          setProvinces([
            { id: "1", code: "01", name_latin: "Banteay Meanchey", name_khmer: "បន្ទាយមានជ័យ" },
            { id: "2", code: "02", name_latin: "Battambang", name_khmer: "បាត់ដំបង" },
            { id: "3", code: "03", name_latin: "Kampong Cham", name_khmer: "កំពង់ចាម" },
            { id: "4", code: "12", name_latin: "Phnom Penh", name_khmer: "ភ្នំពេញ" },
            { id: "5", code: "18", name_latin: "Siem Reap", name_khmer: "សៀមរាប" },
          ])
        } else {
          setProvinces(data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading provinces:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProvinces()
  }, [supabase])

  useEffect(() => {
    async function loadDistricts() {
      if (!selectedProvince) {
        setDistricts([])
        return
      }

      try {
        let provinceId = selectedProvince

        // If selectedProvince is not a UUID, try to find the province by name
        if (!selectedProvince.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const province = provinces.find(
            (p) =>
              p.name_latin === selectedProvince || p.name_khmer === selectedProvince || p.code === selectedProvince,
          )
          if (province) {
            provinceId = province.id
          } else {
            console.log("[v0] Province not found for:", selectedProvince)
            setDistricts([])
            return
          }
        }

        const { data, error } = await supabase
          .from("districts")
          .select("*")
          .eq("province_id", provinceId)
          .order("name_latin")

        if (error) {
          console.error("[v0] Error loading districts:", error)
          // Fallback sample data
          setDistricts([
            { id: "1", code: "0101", name_latin: "Mongkol Borei", name_khmer: "មង្គលបុរី", province_id: provinceId },
            {
              id: "2",
              code: "0102",
              name_latin: "Banteay Neang",
              name_khmer: "បន្ទាយនាង",
              province_id: provinceId,
            },
          ])
        } else {
          setDistricts(data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading districts:", error)
        setDistricts([])
      }
    }

    loadDistricts()
    // Reset dependent selections
    onDistrictChange("")
    onCommuneChange("")
    onVillageChange("")
  }, [selectedProvince, provinces, supabase, onDistrictChange, onCommuneChange, onVillageChange])

  useEffect(() => {
    async function loadCommunes() {
      if (!selectedDistrict) {
        setCommunes([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("communes")
          .select("*")
          .eq("district_id", selectedDistrict)
          .order("name_latin")

        if (error) {
          console.error("[v0] Error loading communes:", error)
          // Fallback sample data
          setCommunes([
            { id: "1", code: "010101", name_latin: "Ou Thum", name_khmer: "អូរធុំ", district_id: selectedDistrict },
            { id: "2", code: "010102", name_latin: "Phnum", name_khmer: "ភ្នំ", district_id: selectedDistrict },
          ])
        } else {
          setCommunes(data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading communes:", error)
      }
    }

    loadCommunes()
    // Reset dependent selections
    onCommuneChange("")
    onVillageChange("")
  }, [selectedDistrict, supabase, onCommuneChange, onVillageChange])

  useEffect(() => {
    async function loadVillages() {
      if (!selectedCommune) {
        setVillages([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("villages")
          .select("*")
          .eq("commune_id", selectedCommune)
          .order("name_latin")

        if (error) {
          console.error("[v0] Error loading villages:", error)
          // Fallback sample data
          setVillages([
            {
              id: "1",
              code: "01010101",
              name_latin: "Sample Village",
              name_khmer: "ភូមិគំរូ",
              commune_id: selectedCommune,
            },
          ])
        } else {
          setVillages(data || [])
        }
      } catch (error) {
        console.error("[v0] Error loading villages:", error)
      }
    }

    loadVillages()
    onVillageChange("")
  }, [selectedCommune, supabase, onVillageChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Administrative Selection</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Province Selection */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Province</label>
          <Select value={selectedProvince} onValueChange={onProvinceChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading provinces..." : "Select a province"} />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  <div className="flex flex-col">
                    <span>
                      {province.name_latin} ({province.code})
                    </span>
                    <span className="text-xs text-muted-foreground font-khmer">{province.name_khmer}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District Selection */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">District</label>
          <Select value={selectedDistrict} onValueChange={onDistrictChange} disabled={!selectedProvince}>
            <SelectTrigger>
              <SelectValue placeholder={selectedProvince ? "Select a district" : "Select province first"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  <div className="flex flex-col">
                    <span>
                      {district.name_latin} ({district.code})
                    </span>
                    <span className="text-xs text-muted-foreground font-khmer">{district.name_khmer}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Commune Selection */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Commune</label>
          <Select value={selectedCommune} onValueChange={onCommuneChange} disabled={!selectedDistrict}>
            <SelectTrigger>
              <SelectValue placeholder={selectedDistrict ? "Select a commune" : "Select district first"} />
            </SelectTrigger>
            <SelectContent>
              {communes.map((commune) => (
                <SelectItem key={commune.id} value={commune.id}>
                  <div className="flex flex-col">
                    <span>
                      {commune.name_latin} ({commune.code})
                    </span>
                    <span className="text-xs text-muted-foreground font-khmer">{commune.name_khmer}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Village Selection */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Village</label>
          <Select value={selectedVillage} onValueChange={onVillageChange} disabled={!selectedCommune}>
            <SelectTrigger>
              <SelectValue placeholder={selectedCommune ? "Select a village" : "Select commune first"} />
            </SelectTrigger>
            <SelectContent>
              {villages.map((village) => (
                <SelectItem key={village.id} value={village.id}>
                  <div className="flex flex-col">
                    <span>
                      {village.name_latin} ({village.code})
                    </span>
                    <span className="text-xs text-muted-foreground font-khmer">{village.name_khmer}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
