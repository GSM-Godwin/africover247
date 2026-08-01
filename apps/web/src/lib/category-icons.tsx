import type { ComponentType } from "react"
import {
  Car, Home, Heart, Activity, Anchor, Settings,
  DollarSign, Shield, Leaf, Plane, Package,
} from "lucide-react"

export const CATEGORY_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  Motor: Car,
  Property: Home,
  Life: Heart,
  Health: Activity,
  Marine: Anchor,
  Engineering: Settings,
  Financial: DollarSign,
  Liability: Shield,
  Agriculture: Leaf,
  Travel: Plane,
}

export const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  Motor: { bg: "bg-blue-50", icon: "text-blue-600" },
  Property: { bg: "bg-amber-50", icon: "text-amber-600" },
  Life: { bg: "bg-rose-50", icon: "text-rose-600" },
  Health: { bg: "bg-green-50", icon: "text-green-600" },
  Marine: { bg: "bg-cyan-50", icon: "text-cyan-600" },
  Engineering: { bg: "bg-orange-50", icon: "text-orange-600" },
  Financial: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  Liability: { bg: "bg-midnight/5", icon: "text-midnight" },
  Agriculture: { bg: "bg-lime-50", icon: "text-lime-600" },
  Travel: { bg: "bg-violet-50", icon: "text-violet-600" },
}

export function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || Package
}

export function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] || { bg: "bg-slate/10", icon: "text-slate" }
}
