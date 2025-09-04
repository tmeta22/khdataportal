"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { AdministrativeSelector } from "@/components/administrative-selector"
import { InteractiveMap } from "@/components/interactive-map"
import { OverviewStats } from "@/components/overview-stats"
import { SearchBar } from "@/components/search-bar"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const [selectedProvince, setSelectedProvince] = useState<string>("")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")
  const [selectedCommune, setSelectedCommune] = useState<string>("")
  const [selectedVillage, setSelectedVillage] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [statistics, setStatistics] = useState({
    provinces: 25,
    districts: 208,
    communes: 1652,
    villages: 14564,
  })

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      console.log("[v0] Loading administrative statistics for welcome message...")

      const [provincesResult, districtsResult, khanResult, communesResult, sangkatResult, villagesResult] =
        await Promise.all([
          supabase.from("provinces").select("id", { count: "exact", head: true }),
          supabase.from("districts").select("id", { count: "exact", head: true }),
          supabase.from("khan").select("id", { count: "exact", head: true }),
          supabase.from("communes").select("id", { count: "exact", head: true }),
          supabase.from("sangkat").select("id", { count: "exact", head: true }),
          supabase.from("villages").select("id", { count: "exact", head: true }),
        ])

      const totalDistricts = (districtsResult.count || 0) + (khanResult.count || 0)
      const totalCommunes = (communesResult.count || 0) + (sangkatResult.count || 0)

      setStatistics({
        provinces: provincesResult.count || 25,
        districts: totalDistricts || 208,
        communes: totalCommunes || 1652,
        villages: villagesResult.count || 14564,
      })

      console.log("[v0] Welcome message statistics loaded:", {
        provinces: provincesResult.count,
        districts: totalDistricts,
        communes: totalCommunes,
        villages: villagesResult.count,
      })
    } catch (error) {
      console.error("[v0] Error loading welcome message statistics:", error)
      // Keep default values on error
    }
  }

  const handleLocationSelect = (location: { type: string; name: string; code: string; id?: string }) => {
    console.log("[v0] Location selected from map:", location)

    if (location.type === "province" || location.type === "capital") {
      setSelectedProvince(location.id || location.code)
      setSelectedDistrict("")
      setSelectedCommune("")
      setSelectedVillage("")
    }

    if (mounted && typeof window !== "undefined") {
      // Track user activity for recently viewed
      const sessionId = sessionStorage.getItem("session_id") || Math.random().toString(36).substring(7)
      sessionStorage.setItem("session_id", sessionId)

      try {
        // Store in localStorage for now (will be replaced with database later)
        const recentActivity = JSON.parse(localStorage.getItem("recent_activity") || "[]")
        const newActivity = {
          id: Math.random().toString(36).substring(7),
          type: location.type,
          name: location.name,
          code: location.code,
          viewedAt: new Date().toISOString(),
        }

        // Add to beginning and keep only last 10
        recentActivity.unshift(newActivity)
        localStorage.setItem("recent_activity", JSON.stringify(recentActivity.slice(0, 10)))
      } catch (error) {
        console.error("[v0] Error saving recent activity:", error)
      }
    }
  }

  const handleSearchResultSelect = (result: any) => {
    console.log("[v0] Search result selected:", result)

    // Update selections based on result type
    switch (result.type) {
      case "province":
        setSelectedProvince(result.id)
        setSelectedDistrict("")
        setSelectedCommune("")
        setSelectedVillage("")
        break
      case "district":
        setSelectedDistrict(result.id)
        setSelectedCommune("")
        setSelectedVillage("")
        break
      case "commune":
        setSelectedCommune(result.id)
        setSelectedVillage("")
        break
      case "village":
        setSelectedVillage(result.id)
        break
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-950/20 dark:to-red-950/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <span className="text-2xl">🇰🇭</span>
              Welcome to Cambodia Administrative Data Portal
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-sm md:text-base">
              Explore Cambodia's complete administrative hierarchy with real-time data from the official Gazetteer
              Database. Access detailed information about all 25 provinces, districts, communes, and villages with
              interactive maps, comprehensive search capabilities, and up-to-date statistics.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {statistics.provinces} Provinces
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {statistics.districts.toLocaleString()} Districts
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-white border border-gray-300 rounded-full"></span>
                {statistics.communes.toLocaleString()} Communes
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {statistics.villages.toLocaleString()} Villages
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
            Interactive Administrative Explorer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4 md:mb-6 text-pretty text-sm md:text-base">
            Navigate and explore Cambodia's administrative hierarchy through interactive maps, cascading selections, and
            comprehensive search capabilities.
          </p>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search provinces, districts, communes, or villages..."
            onResultSelect={handleSearchResultSelect}
          />
        </div>

        <div className="space-y-6">
          {/* Administrative Selection and Overview Stats - Full Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Administrative Selection - Full Width */}
            <div className="lg:col-span-1">
              <AdministrativeSelector
                selectedProvince={selectedProvince}
                selectedDistrict={selectedDistrict}
                selectedCommune={selectedCommune}
                selectedVillage={selectedVillage}
                onProvinceChange={setSelectedProvince}
                onDistrictChange={setSelectedDistrict}
                onCommuneChange={setSelectedCommune}
                onVillageChange={setSelectedVillage}
              />
            </div>

            {/* Overview Stats - Full Width */}
            <div className="lg:col-span-1">
              <OverviewStats />
            </div>
          </div>

          {/* Bottom Row - Full Width Map */}
          <div className="w-full">
            <InteractiveMap
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              selectedCommune={selectedCommune}
              selectedVillage={selectedVillage}
              onLocationSelect={handleLocationSelect}
            />
          </div>
        </div>
      </main>

      <PWAInstallPrompt />

      <footer className="bg-muted/30 border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Data source:{" "}
                <span className="font-medium">
                  Gazetteer Database Online & National Committee for Sub-National Democratic Development (NCDDS)
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                © 2025 Cambodia Administrative Data Portal | Built with AI-Meta@2025 | Inspired by Cambodia Local
                Guides.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
