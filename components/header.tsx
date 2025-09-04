"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  Bell,
  Settings,
  LogIn,
  LogOut,
  Search,
  Map,
  FileText,
  Database,
  ArrowLeft,
  Menu,
  X,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { LoginDialog } from "@/components/login-dialog"
import { ThemeSelector } from "@/components/theme-selector"
import { ChangelogDialog } from "@/components/changelog-dialog"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function Header() {
  const { isAuthenticated, logout, user } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showChangelogDialog, setShowChangelogDialog] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    description: "",
  })
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    loadContactInfo()
  }, [])

  const loadContactInfo = async () => {
    if (typeof window !== "undefined") {
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("contact_info")
          .eq("key", "contact_info")
          .single()

        if (data && data.contact_info) {
          console.log("[v0] Loaded contact info from database:", data.contact_info)
          setContactInfo(data.contact_info)
        } else {
          const savedContact = localStorage.getItem("admin_contact_info")
          if (savedContact) {
            const parsedContact = JSON.parse(savedContact)
            setContactInfo(parsedContact)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading contact info from database:", error)
        const savedContact = localStorage.getItem("admin_contact_info")
        if (savedContact) {
          try {
            const parsedContact = JSON.parse(savedContact)
            setContactInfo(parsedContact)
          } catch (parseError) {
            console.error("[v0] Error parsing localStorage contact info:", parseError)
          }
        }
      }
    }
  }

  const isActiveTab = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  const showBackButton = pathname !== "/"

  const handleSaveContact = async () => {
    if (typeof window !== "undefined") {
      console.log("[v0] Saving contact info to database:", contactInfo)

      try {
        const { error } = await supabase.from("admin_settings").upsert(
          {
            key: "contact_info",
            contact_info: contactInfo,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "key",
          },
        )

        if (error) {
          console.error("[v0] Error saving to database:", error)
          localStorage.setItem("admin_contact_info", JSON.stringify(contactInfo))
          alert("Contact information saved locally (database error)")
        } else {
          console.log("[v0] Contact info saved to database successfully")
          localStorage.setItem("admin_contact_info", JSON.stringify(contactInfo))
          alert("Contact information saved successfully!")
        }
      } catch (error) {
        console.error("[v0] Database save error:", error)
        localStorage.setItem("admin_contact_info", JSON.stringify(contactInfo))
        alert("Contact information saved locally")
      }

      setShowContactDialog(false)
    }
  }

  const handleContactClick = () => {
    console.log("[v0] Contact button clicked, current info:", contactInfo)
    setShowContactDialog(true)
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center space-x-2 md:space-x-3">
              {showBackButton && (
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-1 md:mr-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <Link href="/" className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-foreground text-sm md:text-base">Cambodia Admin</h1>
                  <p className="text-xs text-muted-foreground">Administrative Data Portal</p>
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center space-x-1">
              <Link href="/">
                <Button
                  variant={isActiveTab("/") ? "default" : "ghost"}
                  size="sm"
                  className={isActiveTab("/") ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Explore
                </Button>
              </Link>
              <Link href="/map">
                <Button variant={isActiveTab("/map") ? "default" : "ghost"} size="sm">
                  <Map className="w-4 h-4 mr-2" />
                  Map
                </Button>
              </Link>
              <Link href="/search">
                <Button variant={isActiveTab("/search") ? "default" : "ghost"} size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </Link>
              <Link href="/details">
                <Button variant={isActiveTab("/details") ? "default" : "ghost"} size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </Link>
              {isAuthenticated && (
                <Link href="/data">
                  <Button variant={isActiveTab("/data") ? "default" : "ghost"} size="sm">
                    <Database className="w-4 h-4 mr-2" />
                    Manage Data
                  </Button>
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-1 md:space-x-2">
              <ThemeSelector />

              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={handleContactClick}
                title="Contact Information"
              >
                <Phone className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => setShowChangelogDialog(true)}
                title="Updates & Changelog"
              >
                <Bell className="w-4 h-4" />
              </Button>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex"
                  onClick={handleContactClick}
                  title="Admin Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="hidden sm:flex items-center space-x-2 px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">
                      {user?.username}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowLoginDialog(true)}>
                  <LogIn className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden border-t border-border py-2">
              <nav className="flex flex-col space-y-1">
                <Link href="/" onClick={() => setShowMobileMenu(false)}>
                  <Button
                    variant={isActiveTab("/") ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start ${isActiveTab("/") ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Explore
                  </Button>
                </Link>
                <Link href="/map" onClick={() => setShowMobileMenu(false)}>
                  <Button
                    variant={isActiveTab("/map") ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    Map
                  </Button>
                </Link>
                <Link href="/search" onClick={() => setShowMobileMenu(false)}>
                  <Button
                    variant={isActiveTab("/search") ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </Link>
                <Link href="/details" onClick={() => setShowMobileMenu(false)}>
                  <Button
                    variant={isActiveTab("/details") ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </Link>
                {isAuthenticated && (
                  <Link href="/data" onClick={() => setShowMobileMenu(false)}>
                    <Button
                      variant={isActiveTab("/data") ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Manage Data
                    </Button>
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start lg:hidden"
                  onClick={() => {
                    handleContactClick()
                    setShowMobileMenu(false)
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Info
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start lg:hidden"
                  onClick={() => {
                    setShowChangelogDialog(true)
                    setShowMobileMenu(false)
                  }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Updates
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

      <ChangelogDialog open={showChangelogDialog} onOpenChange={setShowChangelogDialog} />

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAuthenticated ? "Admin Contact Settings" : "Contact Information"}</DialogTitle>
          </DialogHeader>

          {isAuthenticated ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="admin@cambodia-admin.gov.kh"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder="+855 23 xxx xxx"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  placeholder="Phnom Penh, Cambodia"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={contactInfo.description}
                  onChange={(e) => setContactInfo({ ...contactInfo, description: e.target.value })}
                  placeholder="Additional contact information or office hours..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveContact} className="flex-1">
                  Save Contact Info
                </Button>
                <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Get in Touch</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Contact the Cambodia Administrative Data Portal team for support or inquiries.
                </p>
              </div>

              {contactInfo.email && (
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{contactInfo.email}</p>
                </div>
              )}

              {contactInfo.phone && (
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>
                </div>
              )}

              {contactInfo.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground">{contactInfo.address}</p>
                </div>
              )}

              {contactInfo.description && (
                <div>
                  <Label className="text-sm font-medium">Additional Information</Label>
                  <p className="text-sm text-muted-foreground">{contactInfo.description}</p>
                </div>
              )}

              {!contactInfo.email && !contactInfo.phone && !contactInfo.address && !contactInfo.description && (
                <p className="text-sm text-muted-foreground text-center">
                  Contact information will be available once configured by the administrator.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
