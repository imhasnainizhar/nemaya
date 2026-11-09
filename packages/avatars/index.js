"use strict"

/**
 * Nemaya avatar set — 12 original, organic SVG avatars.
 * Single source of truth: the storefront renders these, the backend
 * validates `avatar_id` against AVATAR_IDS, and the mobile app can reuse them.
 *
 * Palette: Linen #F4EFE6 · Sand #E8E0D2 · Bark #2A241D · Stone #8A8072
 *          Clay #B5643C · Moss #5E6B45 · Ochre #C99A4B · Sage #A9B49A · Blush #E4C3AF
 */

const wrap = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img"><rect width="120" height="120" fill="${bg}"/>${body}</svg>`

// simple face helpers
const eyes = (y = 62, color = "#2A241D", gap = 14, cx = 60) =>
  `<circle cx="${cx - gap}" cy="${y}" r="3" fill="${color}"/><circle cx="${cx + gap}" cy="${y}" r="3" fill="${color}"/>`
const smile = (y = 74, color = "#2A241D", cx = 60) =>
  `<path d="M${cx - 9} ${y} Q${cx} ${y + 8} ${cx + 9} ${y}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`

const AVATARS = [
  {
    id: "av-01",
    name: "Clay Curl",
    svg: wrap(
      "#E8E0D2",
      `<path d="M60 112c-26 0-40-10-40-10s4-24 40-24 40 24 40 24-14 10-40 10z" fill="#B5643C"/>` +
        `<path d="M60 92c-17 0-28-13-28-30 0-18 12-31 28-31s28 13 28 31c0 17-11 30-28 30z" fill="#F4EFE6"/>` +
        `<path d="M30 58c-4-20 10-34 30-34s34 12 31 32c-6-8-12-12-20-13 2 5 1 9-2 11-3-8-10-12-20-12-9 0-15 6-19 16z" fill="#2A241D"/>` +
        eyes(64) +
        smile(76)
    ),
  },
  {
    id: "av-02",
    name: "Moss Bob",
    svg: wrap(
      "#A9B49A",
      `<path d="M60 114c-28 0-42-12-42-12s6-22 42-22 42 22 42 22-14 12-42 12z" fill="#5E6B45"/>` +
        `<path d="M28 66c0-22 14-38 32-38s32 16 32 38v14H28z" fill="#2A241D"/>` +
        `<ellipse cx="60" cy="64" rx="24" ry="27" fill="#E4C3AF"/>` +
        `<path d="M36 56c4-14 14-20 24-20s20 6 24 20c-10-4-18-10-24-16-6 6-14 12-24 16z" fill="#2A241D"/>` +
        eyes(66, "#2A241D", 10) +
        smile(78, "#B5643C")
    ),
  },
  {
    id: "av-03",
    name: "Ochre Sun",
    svg: wrap(
      "#F4EFE6",
      `<g fill="#C99A4B">` +
        Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6
          const x = (60 + Math.cos(a) * 42).toFixed(1)
          const y = (60 + Math.sin(a) * 42).toFixed(1)
          return `<ellipse cx="${x}" cy="${y}" rx="7" ry="11" transform="rotate(${i * 30 + 90} ${x} ${y})"/>`
        }).join("") +
        `</g><circle cx="60" cy="60" r="28" fill="#C99A4B"/>` +
        eyes(58, "#2A241D", 9) +
        smile(68, "#2A241D")
    ),
  },
  {
    id: "av-04",
    name: "Bark Beanie",
    svg: wrap(
      "#B5643C",
      `<path d="M60 114c-26 0-40-12-40-12s5-22 40-22 40 22 40 22-14 12-40 12z" fill="#2A241D"/>` +
        `<path d="M60 94c-16 0-27-12-27-29s11-29 27-29 27 12 27 29-11 29-27 29z" fill="#E8E0D2"/>` +
        `<path d="M32 58c0-18 12-32 28-32s28 14 28 32z" fill="#5E6B45"/>` +
        `<rect x="30" y="52" width="60" height="10" rx="5" fill="#2A241D"/>` +
        `<circle cx="60" cy="24" r="6" fill="#5E6B45"/>` +
        eyes(70, "#2A241D", 10) +
        `<path d="M53 81h14" stroke="#2A241D" stroke-width="3" stroke-linecap="round"/>`
    ),
  },
  {
    id: "av-05",
    name: "Pebble Stack",
    svg: wrap(
      "#E8E0D2",
      `<ellipse cx="60" cy="96" rx="34" ry="12" fill="#8A8072"/>` +
        `<ellipse cx="60" cy="74" rx="26" ry="11" fill="#5E6B45"/>` +
        `<ellipse cx="60" cy="54" rx="19" ry="10" fill="#B5643C"/>` +
        `<ellipse cx="60" cy="36" rx="12" ry="8" fill="#2A241D"/>` +
        `<ellipse cx="55" cy="33" rx="4" ry="2" fill="#F4EFE6" opacity=".5"/>`
    ),
  },
  {
    id: "av-06",
    name: "Leaf",
    svg: wrap(
      "#5E6B45",
      `<path d="M60 18c28 14 36 46 20 72-6 10-14 16-20 18-6-2-14-8-20-18-16-26-8-58 20-72z" fill="#A9B49A"/>` +
        `<path d="M60 26v84" stroke="#2A241D" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M60 50l-14-10M60 66l-18-12M60 82l-16-10M60 50l14-10M60 66l18-12M60 82l16-10" stroke="#2A241D" stroke-width="2.5" stroke-linecap="round" fill="none"/>`
    ),
  },
  {
    id: "av-07",
    name: "Blush Buns",
    svg: wrap(
      "#E4C3AF",
      `<path d="M60 114c-26 0-40-12-40-12s5-22 40-22 40 22 40 22-14 12-40 12z" fill="#F4EFE6"/>` +
        `<circle cx="36" cy="32" r="11" fill="#2A241D"/><circle cx="84" cy="32" r="11" fill="#2A241D"/>` +
        `<path d="M60 94c-16 0-27-12-27-29s11-29 27-29 27 12 27 29-11 29-27 29z" fill="#C99A4B"/>` +
        `<path d="M33 60c0-16 12-26 27-26s27 10 27 26c-8-8-16-12-27-12s-19 4-27 12z" fill="#2A241D"/>` +
        eyes(66, "#2A241D", 10) +
        `<circle cx="42" cy="74" r="4" fill="#B5643C" opacity=".55"/><circle cx="78" cy="74" r="4" fill="#B5643C" opacity=".55"/>` +
        smile(77)
    ),
  },
  {
    id: "av-08",
    name: "Dune",
    svg: wrap(
      "#F4EFE6",
      `<circle cx="80" cy="38" r="14" fill="#B5643C"/>` +
        `<path d="M0 80c20-14 40-14 60-4s40 10 60-2v46H0z" fill="#C99A4B"/>` +
        `<path d="M0 96c24-10 44-8 64 0s38 8 56 0v24H0z" fill="#8A8072"/>`
    ),
  },
  {
    id: "av-09",
    name: "Sage Wave",
    svg: wrap(
      "#2A241D",
      `<path d="M60 114c-26 0-40-12-40-12s5-22 40-22 40 22 40 22-14 12-40 12z" fill="#A9B49A"/>` +
        `<path d="M60 94c-16 0-27-12-27-29s11-29 27-29 27 12 27 29-11 29-27 29z" fill="#E8E0D2"/>` +
        `<path d="M30 62c-2-22 12-36 30-36 16 0 30 10 30 28-8 2-14-2-18-8-4 8-12 12-22 12-8 0-14 2-20 4z" fill="#B5643C"/>` +
        `<path d="M50 68h8M64 68h8" stroke="#2A241D" stroke-width="3" stroke-linecap="round"/>` +
        smile(78)
    ),
  },
  {
    id: "av-10",
    name: "Moon Pebble",
    svg: wrap(
      "#8A8072",
      `<circle cx="60" cy="60" r="34" fill="#F4EFE6"/>` +
        `<circle cx="74" cy="50" r="30" fill="#8A8072"/>` +
        `<circle cx="40" cy="70" r="4" fill="#E8E0D2"/><circle cx="50" cy="84" r="2.5" fill="#E8E0D2"/>`
    ),
  },
  {
    id: "av-11",
    name: "Terracotta Shades",
    svg: wrap(
      "#A9B49A",
      `<path d="M60 114c-26 0-40-12-40-12s5-22 40-22 40 22 40 22-14 12-40 12z" fill="#B5643C"/>` +
        `<path d="M60 94c-16 0-27-12-27-29s11-29 27-29 27 12 27 29-11 29-27 29z" fill="#C99A4B"/>` +
        `<path d="M32 58c0-18 12-30 28-30s28 12 28 30c-6-6-12-10-18-10l-10 6-10-6c-6 0-12 4-18 10z" fill="#2A241D"/>` +
        `<rect x="36" y="58" width="20" height="12" rx="6" fill="#2A241D"/><rect x="64" y="58" width="20" height="12" rx="6" fill="#2A241D"/>` +
        `<path d="M56 63h8" stroke="#2A241D" stroke-width="3"/>` +
        `<path d="M53 80q7 5 14 0" fill="none" stroke="#2A241D" stroke-width="3" stroke-linecap="round"/>`
    ),
  },
  {
    id: "av-12",
    name: "Sprout",
    svg: wrap(
      "#E8E0D2",
      `<path d="M38 82h44l-6 26H44z" fill="#B5643C"/>` +
        `<rect x="34" y="76" width="52" height="10" rx="4" fill="#2A241D"/>` +
        `<path d="M60 76V46" stroke="#5E6B45" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M60 52c-4-16-18-22-28-18 2 12 14 20 28 18z" fill="#5E6B45"/>` +
        `<path d="M60 46c4-16 18-22 28-18-2 12-14 20-28 18z" fill="#A9B49A"/>`
    ),
  },
]

const AVATAR_IDS = AVATARS.map((a) => a.id)
const DEFAULT_AVATAR_ID = "av-01"

function getAvatar(id) {
  return AVATARS.find((a) => a.id === id) || AVATARS[0]
}

function isValidAvatarId(id) {
  return typeof id === "string" && AVATAR_IDS.includes(id)
}

function avatarDataUri(id) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(getAvatar(id).svg)
}

module.exports = {
  AVATARS,
  AVATAR_IDS,
  DEFAULT_AVATAR_ID,
  getAvatar,
  isValidAvatarId,
  avatarDataUri,
}
