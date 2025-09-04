"use client"

import { Heart, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"

export function Footer() {
  const [showSupportDialog, setShowSupportDialog] = useState(false)

  return (
    <>
      <footer className="bg-background border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              
              
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSupportDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Support Us
              </Button>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent className="max-w-md z-[9999] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600 fill-current" />
              Support Our Work
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Help us maintain and improve the Cambodia Administrative Data Portal. Your support enables us to provide
              better services and keep the data updated.
            </p>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Buy Me a Coffee</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img
                    src="/qr-code-for-buymeacoffee-com-thebmeta.jpg"
                    alt="Buy Me a Coffee QR Code"
                    className="w-32 h-32 mx-auto mb-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://buymeacoffee.com/thebmeta", "_blank")}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    buymeacoffee.com/thebmeta
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold mb-2">ABA PayWay</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img
                    src="/qr-code-for-aba-payway-payment.jpg"
                    alt="ABA PayWay QR Code"
                    className="w-32 h-32 mx-auto mb-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://pay.ababank.com/oRF8/ksqxcxr0", "_blank")}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    ABA PayWay
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Thank you for supporting open data initiatives in Cambodia! 🇰🇭
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
