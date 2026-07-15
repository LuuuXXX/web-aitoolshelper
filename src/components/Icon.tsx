import * as Icons from 'lucide-react'
import type { ComponentType } from 'react'

interface IconProps {
  name: string
  className?: string
}

export default function Icon({ name, className }: IconProps) {
  const iconMap = Icons as unknown as Record<string, ComponentType<{ className?: string }>>
  const IconComponent = iconMap[name] || Icons.Sparkles
  return <IconComponent className={className} />
}
