"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"
import { createClient } from "@/lib/supabase/client"

interface ProvinceStats {
  id: number
  code: string
  name_khmer: string
  name_latin: string
  reference: string
  krong_count: number
  srok_count: number
  khan_count: number
  commune_count: number
  sangkat_count: number
  village_count: number
}

export default function ProvincesPage() {
  const [provinces, setProvinces] = useState<ProvinceStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({
    krong: 0,
    srok: 0,
    khan: 0,
    commune: 0,
    sangkat: 0,
    village: 0,
  })

  useEffect(() => {
    loadProvinceStats()
  }, [])

  const loadProvinceStats = async () => {
    try {
      const supabase = createClient()

      // Get all provinces
      const { data: provincesData } = await supabase.from("provinces").select("*").order("code")

      if (!provincesData) return

      // Get statistics for each province
      const statsPromises = provincesData.map(async (province) => {
        // Count districts by type
        const { data: districts } = await supabase.from("districts").select("type").eq("province_id", province.id)

        const krong_count = districts?.filter((d) => d.type === "municipality").length || 0
        const srok_count = districts?.filter((d) => d.type === "district").length || 0
        const khan_count = districts?.filter((d) => d.type === "khan").length || 0

        // Count communes by type
        const { data: communes } = await supabase
          .from("communes")
          .select("type, district_id")
          .in("district_id", districts?.map((d) => d.id) || [])

        const commune_count = communes?.filter((c) => c.type === "commune").length || 0
        const sangkat_count = communes?.filter((c) => c.type === "sangkat").length || 0

        // Count villages
        const { data: villages } = await supabase
          .from("villages")
          .select("id")
          .in("commune_id", communes?.map((c) => c.id) || [])

        const village_count = villages?.length || 0

        return {
          ...province,
          krong_count,
          srok_count,
          khan_count,
          commune_count,
          sangkat_count,
          village_count,
        }
      })

      const stats = await Promise.all(statsPromises)
      setProvinces(stats)

      // Calculate totals
      const newTotals = stats.reduce(
        (acc, province) => ({
          krong: acc.krong + province.krong_count,
          srok: acc.srok + province.srok_count,
          khan: acc.khan + province.khan_count,
          commune: acc.commune + province.commune_count,
          sangkat: acc.sangkat + province.sangkat_count,
          village: acc.village + province.village_count,
        }),
        { krong: 0, srok: 0, khan: 0, commune: 0, sangkat: 0, village: 0 },
      )

      setTotals(newTotals)
    } catch (error) {
      console.error("[v0] Error loading province stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">Provincial/Municipal Statistics</h1>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold">Provincial/Municipal Statistics</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrative Division Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Khmer</TableHead>
                  <TableHead>English</TableHead>
                  <TableHead className="text-center">Krong</TableHead>
                  <TableHead className="text-center">Srok</TableHead>
                  <TableHead className="text-center">Khan</TableHead>
                  <TableHead className="text-center">Commune</TableHead>
                  <TableHead className="text-center">Sangkat</TableHead>
                  <TableHead className="text-center">Village</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinces.map((province, index) => (
                  <TableRow key={province.id}>
                    <TableCell className="font-mono">{province.code}</TableCell>
                    <TableCell className="font-khmer">{province.name_khmer}</TableCell>
                    <TableCell>{province.name_latin}</TableCell>
                    <TableCell className="text-center">
                      {province.krong_count > 0 && <Badge variant="secondary">{province.krong_count}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      {province.srok_count > 0 && <Badge variant="secondary">{province.srok_count}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      {province.khan_count > 0 && <Badge variant="secondary">{province.khan_count}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      {province.commune_count > 0 && <Badge variant="secondary">{province.commune_count}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      {province.sangkat_count > 0 && <Badge variant="secondary">{province.sangkat_count}</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{province.village_count.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell className="font-khmer text-xs">{province.reference}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-center">{totals.krong}</TableCell>
                  <TableCell className="text-center">{totals.srok}</TableCell>
                  <TableCell className="text-center">{totals.khan}</TableCell>
                  <TableCell className="text-center">{totals.commune}</TableCell>
                  <TableCell className="text-center">{totals.sangkat}</TableCell>
                  <TableCell className="text-center">{totals.village.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
