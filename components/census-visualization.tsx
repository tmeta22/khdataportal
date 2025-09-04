"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, LineChart, PieChart, ScanText as Scatter, Download, Filter } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ScatterChart,
  Scatter as RechartsScatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface CensusVisualizationProps {
  onDataChange?: () => void
}

export function CensusVisualization({ onDataChange }: CensusVisualizationProps) {
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [chartType, setChartType] = useState<string>("bar")
  const [metric, setMetric] = useState<string>("total")
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const supabase = createClientComponentClient()

  const chartTypes = [
    { value: "bar", label: "Bar Chart", icon: BarChart3 },
    { value: "line", label: "Line Chart", icon: LineChart },
    { value: "pie", label: "Pie Chart", icon: PieChart },
    { value: "scatter", label: "Scatter Plot", icon: Scatter },
  ]

  const metrics = [
    { value: "total", label: "Total Population" },
    { value: "males", label: "Male Population" },
    { value: "females", label: "Female Population" },
    { value: "households", label: "Households" },
    { value: "household_size", label: "Household Size" },
    { value: "area_km2", label: "Area (km²)" },
    { value: "pop_km2", label: "Population Density" },
  ]

  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
  ]

  useEffect(() => {
    loadCensusData()
  }, [])

  useEffect(() => {
    filterData()
  }, [data, selectedYear])

  const loadCensusData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading census data for visualization...")

      const { data: censusData, error } = await supabase.from("census_data").select("*").order("provinces")

      if (error) {
        console.error("[v0] Error loading census data:", error)
        return
      }

      setData(censusData || [])

      // Extract available years
      const years = [...new Set((censusData || []).map((item) => item.year))].sort()
      setAvailableYears(years)

      console.log("[v0] Census data loaded:", censusData?.length, "records")
    } catch (error) {
      console.error("[v0] Error loading census data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = data

    if (selectedYear !== "all") {
      filtered = data.filter((item) => item.year === Number.parseInt(selectedYear))
    }

    // Sort by the selected metric for better visualization
    filtered.sort((a, b) => {
      const aValue = a[metric] || 0
      const bValue = b[metric] || 0
      return bValue - aValue
    })

    setFilteredData(filtered)
  }

  const exportData = () => {
    const csvContent = [
      // Headers
      [
        "Province",
        "Year",
        "Total Population",
        "Males",
        "Females",
        "Households",
        "Household Size",
        "Area (km²)",
        "Population Density",
      ].join(","),
      // Data rows
      ...filteredData.map((item) =>
        [
          item.provinces,
          item.year,
          item.total || 0,
          item.males || 0,
          item.females || 0,
          item.households || 0,
          item.household_size || 0,
          item.area_km2 || 0,
          item.pop_km2 || 0,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `census_data_${selectedYear}_${metric}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderChart = () => {
    if (loading || filteredData.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          {loading ? "Loading data..." : "No data available"}
        </div>
      )
    }

    const chartData = filteredData.map((item) => ({
      name: item.provinces,
      value: item[metric] || 0,
      year: item.year,
      ...item,
    }))

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} name={metrics.find((m) => m.value === metric)?.label} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                name={metrics.find((m) => m.value === metric)?.label}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieData = chartData.slice(0, 10) // Top 10 for readability
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        const scatterData = chartData.map((item) => ({
          x: item.area_km2 || 0,
          y: item.value,
          name: item.name,
        }))
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={scatterData}>
              <CartesianGrid />
              <XAxis dataKey="x" name="Area (km²)" />
              <YAxis dataKey="y" name={metrics.find((m) => m.value === metric)?.label} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <RechartsScatter dataKey="y" fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Census Data Visualization
        </CardTitle>
        <CardDescription>
          Interactive charts and graphs for exploring demographic and geographic census data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Type</label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Metric</label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Actions</label>
            <Button onClick={exportData} variant="outline" className="w-full bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex flex-wrap gap-4">
          <Badge variant="secondary">
            <Filter className="h-3 w-3 mr-1" />
            {filteredData.length} provinces
          </Badge>
          {selectedYear !== "all" && <Badge variant="outline">Year: {selectedYear}</Badge>}
          <Badge variant="outline">Metric: {metrics.find((m) => m.value === metric)?.label}</Badge>
        </div>

        {/* Chart */}
        <div className="border rounded-lg p-4">{renderChart()}</div>

        {/* Summary Statistics */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {filteredData.reduce((sum, item) => sum + (item[metric] || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total {metrics.find((m) => m.value === metric)?.label}
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  filteredData.reduce((sum, item) => sum + (item[metric] || 0), 0) / filteredData.length,
                ).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Average</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...filteredData.map((item) => item[metric] || 0)).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Maximum</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {Math.min(...filteredData.map((item) => item[metric] || 0)).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Minimum</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
