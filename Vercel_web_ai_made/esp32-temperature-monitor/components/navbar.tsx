"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Thermometer, History, BarChart2 } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-xl font-bold">
              <Thermometer className="h-6 w-6 mr-2" />
              <span>ESP32 Monitor</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Dashboard
            </Link>

            <Link
              href="/history"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/history")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
