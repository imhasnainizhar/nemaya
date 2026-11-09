"use client"

import { AVATARS } from "@nemaya/avatars"
import { cn } from "@/lib/util"

export function AvatarPicker({
  value,
  onChange,
  name = "avatar_id",
}: {
  value: string
  onChange: (id: string) => void
  name?: string
}) {
  return (
    <fieldset>
      <legend className="label">Choose your avatar</legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-6 gap-2.5 sm:gap-3">
        {AVATARS.map((a) => {
          const active = a.id === value
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.id)}
              aria-label={a.name}
              aria-pressed={active}
              title={a.name}
              className={cn(
                "aspect-square overflow-hidden rounded-full transition-all duration-300 [&>svg]:h-full [&>svg]:w-full",
                active ? "scale-105 ring-2 ring-clay ring-offset-2 ring-offset-paper" : "opacity-80 ring-1 ring-bark/10 hover:opacity-100"
              )}
              dangerouslySetInnerHTML={{ __html: a.svg }}
            />
          )
        })}
      </div>
    </fieldset>
  )
}
