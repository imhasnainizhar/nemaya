import { getAvatar } from "@nemaya/avatars"
import { cn } from "@/lib/util"

export function Avatar({ id, size = 36, className }: { id?: string | null; size?: number; className?: string }) {
  const avatar = getAvatar(id)
  return (
    <span
      role="img"
      aria-label={`Avatar: ${avatar.name}`}
      className={cn("inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-bark/10 [&>svg]:h-full [&>svg]:w-full", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: avatar.svg }}
    />
  )
}
