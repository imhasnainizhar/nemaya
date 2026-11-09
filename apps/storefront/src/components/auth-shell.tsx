import { Leaf } from "lucide-react"

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-[calc(100dvh-160px)] items-center gap-10 py-12 lg:grid-cols-2">
      <div className="relative hidden aspect-square max-h-[620px] overflow-hidden rounded-[40px] bg-moss lg:block">
        <div className="grain absolute inset-0" />
        <div className="blob absolute -top-10 -left-16 h-80 w-80 bg-sage/50" />
        <div className="blob absolute right-10 bottom-10 h-72 w-72 bg-clay/60" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-linen">
          <Leaf className="h-10 w-10" strokeWidth={1.2} />
          <p className="font-display mt-6 text-5xl leading-[1.05]">Rooted in
            <br /><span className="italic">comfort.</span></p>
          <p className="mt-4 max-w-sm text-linen/80">Your wishlist, drop alerts, order updates and gift cards — all in one place.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md animate-rise">
        <h1 className="font-display text-5xl tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-bark-soft">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  )
}
