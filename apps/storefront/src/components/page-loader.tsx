"use client"

import { useEffect, useRef, useState } from "react"

const KEY = "nemaya:loaded"
const WORD = "nemaya"

/**
 * Full-screen loading screen (motion cloned from the reference theme):
 *  - letters rise in one by one (0.9s, 35ms stagger)
 *  - a solid wordmark fills bottom-up over a faint "ghost" copy as progress grows
 *  - progress line scales with load progress
 *  - exit: the panel sweeps up while a curved skirt stretches beneath it
 * It is server-rendered so it covers the page before hydration.
 */
export function PageLoader({ oncePerSession }: { oncePerSession: boolean }) {
  const [progress, setProgress] = useState(0.08)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)
  const done = useRef(false)

  useEffect(() => {
    // returning visitor in this session → the inline <head> script already hid it
    if (document.documentElement.hasAttribute("data-pl-skip")) {
      setGone(true)
      return
    }
    document.documentElement.style.overflow = "hidden"

    // ease toward 90% while the page finishes loading
    const tick = setInterval(() => setProgress((p) => (p < 0.9 ? p + (0.9 - p) * 0.12 : p)), 120)

    const finish = () => {
      if (done.current) return
      done.current = true
      clearInterval(tick)
      setProgress(1)
      try {
        if (oncePerSession) sessionStorage.setItem(KEY, "1")
      } catch {}
      setTimeout(() => setLeaving(true), 450) // let the fill complete
      setTimeout(() => {
        setGone(true)
        document.documentElement.style.overflow = ""
      }, 450 + 1100)
    }

    const ready = Promise.all([
      document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true })),
      (document as any).fonts?.ready ?? Promise.resolve(),
      new Promise((r) => setTimeout(r, 900)), // minimum time so the intro can play
    ])
    ready.then(finish)
    const safety = setTimeout(finish, 6000) // never trap the user

    return () => {
      clearInterval(tick)
      clearTimeout(safety)
      document.documentElement.style.overflow = ""
    }
  }, [oncePerSession])

  if (gone) return null

  const mark = (solid: boolean) => (
    <span className={solid ? "pl-mark pl-mark--solid" : "pl-mark pl-mark--ghost"} aria-hidden>
      <span className="pl-name font-display">
        {[...WORD].map((c, i) => (
          <span key={i} className="pl-char" style={{ ["--pl-i" as any]: i }}>
            {c}
          </span>
        ))}
        <span className="pl-char text-clay" style={{ ["--pl-i" as any]: WORD.length }}>.</span>
      </span>
    </span>
  )

  return (
    <div
      data-pl-page-loader
      className="pl"
      data-leaving={leaving}
      style={{ ["--pl-progress" as any]: progress }}
      role="progressbar"
      aria-label="Loading Nemaya"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div className="pl-curve" aria-hidden />
      <div className="pl-content">
        <span className="pl-brand">
          {mark(false)}
          {mark(true)}
        </span>
        <p className="pl-tagline">Rooted in comfort</p>
        <span className="pl-line" aria-hidden>
          <span className="pl-line-fill" />
        </span>
      </div>
    </div>
  )
}

/** Inline <head> script: hide the loader before first paint for returning visitors in this session. */
export const pageLoaderSkipScript = `try{if(sessionStorage.getItem("${KEY}"))document.documentElement.setAttribute("data-pl-skip","")}catch(e){}`
