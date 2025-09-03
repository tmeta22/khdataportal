"use client"

import { Search, X, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onResultSelect?: (result: SearchResult) => void
}

interface SearchResult {
  id: string
  type: "province" | "district" | "commune" | "village"
  code: string
  name_latin: string
  name_khmer: string
  parent_name?: string
}

export function SearchBar({ value, onChange, placeholder, onResultSelect }: SearchBarProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const searchAdministrativeData = async () => {
      if (!value.trim() || value.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      try {
        console.log("[v0] Searching for:", value)

        const searchTerm = value.toLowerCase()

        // Search across all administrative levels
        const [provinces, districts, communes, villages] = await Promise.all([
          supabase
            .from("provinces")
            .select("id, code, name_latin, name_khmer")
            .or(`name_latin.ilike.%${searchTerm}%,name_khmer.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
            .limit(5),
          supabase
            .from("districts")
            .select(`
              id, code, name_latin, name_khmer,
              provinces!inner(name_latin)
            `)
            .or(`name_latin.ilike.%${searchTerm}%,name_khmer.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
            .limit(5),
          supabase
            .from("communes")
            .select(`
              id, code, name_latin, name_khmer,
              districts!inner(name_latin, provinces!inner(name_latin))
            `)
            .or(`name_latin.ilike.%${searchTerm}%,name_khmer.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
            .limit(5),
          supabase
            .from("villages")
            .select(`
              id, code, name_latin, name_khmer,
              communes!inner(name_latin, districts!inner(name_latin))
            `)
            .or(`name_latin.ilike.%${searchTerm}%,name_khmer.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
            .limit(3),
        ])

        const searchResults: SearchResult[] = [
          ...(provinces.data || []).map((p: any) => ({
            ...p,
            type: "province" as const,
            parent_name: "Cambodia",
          })),
          ...(districts.data || []).map((d: any) => ({
            ...d,
            type: "district" as const,
            parent_name: d.provinces?.name_latin,
          })),
          ...(communes.data || []).map((c: any) => ({
            ...c,
            type: "commune" as const,
            parent_name: `${c.districts?.name_latin}, ${c.districts?.provinces?.name_latin}`,
          })),
          ...(villages.data || []).map((v: any) => ({
            ...v,
            type: "village" as const,
            parent_name: `${v.communes?.name_latin}, ${v.communes?.districts?.name_latin}`,
          })),
        ]

        console.log("[v0] Search results:", searchResults.length)
        setResults(searchResults)
        setIsOpen(searchResults.length > 0)
      } catch (error) {
        console.error("[v0] Search error:", error)
        setResults([])
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchAdministrativeData, 300)
    return () => clearTimeout(debounceTimer)
  }, [value, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    onChange(result.name_latin)
    setIsOpen(false)
    onResultSelect?.(result)

    // Track activity
    if (typeof window !== "undefined" && (window as any).trackRecentActivity) {
      ;(window as any).trackRecentActivity({
        type: result.type,
        id: result.id,
        name_latin: result.name_latin,
        name_khmer: result.name_khmer,
        code: result.code,
      })
    }
  }

  const clearSearch = () => {
    onChange("")
    setResults([])
    setIsOpen(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "province":
        return "text-blue-600 bg-blue-50"
      case "district":
        return "text-green-600 bg-green-50"
      case "commune":
        return "text-purple-600 bg-purple-50"
      case "village":
        return "text-orange-600 bg-orange-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="relative max-w-md mx-auto" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full"
          onFocus={() => value.length >= 2 && results.length > 0 && setIsOpen(true)}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{result.name_latin}</span>
                      <span className="text-xs text-muted-foreground">{result.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-khmer">{result.name_khmer}</span>
                      {result.parent_name && <span className="ml-2">• {result.parent_name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{value}"</div>
          )}
        </Card>
      )}
    </div>
  )
}
