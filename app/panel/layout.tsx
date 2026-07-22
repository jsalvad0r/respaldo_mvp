import type { Metadata } from "next"

import { PanelSidebar } from "@/components/panel/sidebar"

export const metadata: Metadata = {
  title: "Panel del piloto · VidaSegura",
  description: "Panel interno para gestionar la activación de seguros",
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <PanelSidebar />
      <div className="pl-60">
        <main className="mx-auto max-w-7xl px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
