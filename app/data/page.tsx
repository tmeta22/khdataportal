"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import {
  Upload,
  Table,
  AlertCircle,
  Loader2,
  MapPin,
  Building,
  Home,
  TreePine,
  Map,
  BarChart3,
  Users,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"

const DataTable = dynamic(() => import("@/components/data-table").then((mod) => ({ default: mod.DataTable })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      <span>Loading data table...</span>
    </div>
  ),
})

const DataImport = dynamic(() => import("@/components/data-import").then((mod) => ({ default: mod.DataImport })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      <span>Loading import tools...</span>
    </div>
  ),
})

const CoordinateImport = dynamic(
  () => import("@/components/coordinate-import").then((mod) => ({ default: mod.CoordinateImport })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading coordinate import...</span>
      </div>
    ),
  },
)

const CoordinateDetailsTable = dynamic(
  () => import("@/components/coordinate-details-table").then((mod) => ({ default: mod.CoordinateDetailsTable })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading coordinate details...</span>
      </div>
    ),
  },
)

const BoundaryImport = dynamic(
  () => import("@/components/boundary-import").then((mod) => ({ default: mod.BoundaryImport })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading boundary import...</span>
      </div>
    ),
  },
)

const BoundaryDetailsTable = dynamic(
  () => import("@/components/boundary-details-table").then((mod) => ({ default: mod.BoundaryDetailsTable })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading boundary details...</span>
      </div>
    ),
  },
)

const CensusImport = dynamic(
  () => import("@/components/census-import").then((mod) => ({ default: mod.CensusImport })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading census import...</span>
      </div>
    ),
  },
)

const CensusVisualization = dynamic(
  () => import("@/components/census-visualization").then((mod) => ({ default: mod.CensusVisualization })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading census visualization...</span>
      </div>
    ),
  },
)

const CensusDetailsTable = dynamic(
  () => import("@/components/census-details-table").then((mod) => ({ default: mod.CensusDetailsTable })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading census details...</span>
      </div>
    ),
  },
)

const PhnomPenhBulkManager = dynamic(
  () => import("@/components/phnom-penh-bulk-manager").then((mod) => ({ default: mod.PhnomPenhBulkManager })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading bulk manager...</span>
      </div>
    ),
  },
)

interface SummaryCounts {
  provinces: number
  districts: number
  communes: number
  villages: number
}

export default function DataPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [dbError, setDbError] = useState<string | null>(null)
  const [summaryCounts, setSummaryCounts] = useState<SummaryCounts>({
    provinces: 0,
    districts: 0,
    communes: 0,
    villages: 0,
  })
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [isClient, setIsClient] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const loadSummaryCounts = async () => {
    try {
      setLoadingCounts(true)
      console.log("[v0] Loading summary counts...")

      const [provincesResult, districtsResult, communesResult, villagesResult] = await Promise.all([
        supabase.from("provinces").select("id", { count: "exact", head: true }),
        supabase.from("districts").select("id", { count: "exact", head: true }),
        supabase.from("communes").select("id", { count: "exact", head: true }),
        supabase.from("villages").select("id", { count: "exact", head: true }),
      ])

      setSummaryCounts({
        provinces: provincesResult.count || 0,
        districts: districtsResult.count || 0,
        communes: communesResult.count || 0,
        villages: villagesResult.count || 0,
      })

      console.log("[v0] Summary counts loaded:", {
        provinces: provincesResult.count,
        districts: districtsResult.count,
        communes: communesResult.count,
        villages: villagesResult.count,
      })
    } catch (error) {
      console.error("[v0] Error loading summary counts:", error)
    } finally {
      setLoadingCounts(false)
    }
  }

  const handleDataRefresh = () => {
    loadSummaryCounts()
  }

  useEffect(() => {
    console.log("[v0] Data page - Auth loading:", authLoading, "Authenticated:", isAuthenticated)

    if (isClient && !authLoading && !isAuthenticated) {
      console.log("[v0] User not authenticated, redirecting to home")
      router.replace("/")
    } else if (isClient && isAuthenticated) {
      loadSummaryCounts()
    }
  }, [isAuthenticated, authLoading, router, isClient])

  useEffect(() => {
    const checkDbConnection = () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setDbError("Database connection not configured. Please check environment variables.")
      } else {
        setDbError(null)
      }
    }

    checkDbConnection()
  }, [])

  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Checking authentication...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Data Management</h1>
          <p className="text-muted-foreground">Import, export, and manage Cambodia's administrative data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Provinces</p>
                <p className="text-2xl font-bold">
                  {loadingCounts ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    summaryCounts.provinces.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Districts</p>
                <p className="text-2xl font-bold">
                  {loadingCounts ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    summaryCounts.districts.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Communes</p>
                <p className="text-2xl font-bold">
                  {loadingCounts ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    summaryCounts.communes.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TreePine className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Villages</p>
                <p className="text-2xl font-bold">
                  {loadingCounts ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    summaryCounts.villages.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {dbError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {dbError}
              <br />
              <span className="text-sm">
                Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10">
            <TabsTrigger value="browse" className="flex items-center space-x-2">
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Data</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import Data</span>
            </TabsTrigger>
            <TabsTrigger value="coordinates" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Coordinates</span>
            </TabsTrigger>
            <TabsTrigger value="coordinate-details" className="flex items-center space-x-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Coord Details</span>
            </TabsTrigger>
            <TabsTrigger value="phnom-penh-bulk" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">PP Bulk</span>
            </TabsTrigger>
            <TabsTrigger value="boundaries" className="flex items-center space-x-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Boundaries</span>
            </TabsTrigger>
            <TabsTrigger value="boundary-details" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Bound Details</span>
            </TabsTrigger>
            <TabsTrigger value="census-import" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Census Import</span>
            </TabsTrigger>
            <TabsTrigger value="census-viz" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Census Charts</span>
            </TabsTrigger>
            <TabsTrigger value="census-details" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Census Details</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <DataTable />
          </TabsContent>

          <TabsContent value="import">
            <DataImport />
          </TabsContent>

          <TabsContent value="coordinates">
            <CoordinateImport />
          </TabsContent>

          <TabsContent value="coordinate-details">
            <CoordinateDetailsTable />
          </TabsContent>

          <TabsContent value="phnom-penh-bulk">
            <PhnomPenhBulkManager onDataChange={handleDataRefresh} />
          </TabsContent>

          <TabsContent value="boundaries">
            <BoundaryImport />
          </TabsContent>

          <TabsContent value="boundary-details">
            <BoundaryDetailsTable />
          </TabsContent>

          <TabsContent value="census-import">
            <CensusImport onImportComplete={handleDataRefresh} />
          </TabsContent>

          <TabsContent value="census-viz">
            <CensusVisualization onDataChange={handleDataRefresh} />
          </TabsContent>

          <TabsContent value="census-details">
            <CensusDetailsTable onDataChange={handleDataRefresh} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
