"use strict"
/** Original flat garment illustrations + demo catalog shared by the Medusa seed and the storefront mock mode. */
const COLORS = {
  bark: { hex: "#3A322A", shade: "#2A241D", label: "Bark" },
  sand: { hex: "#D9CBB4", shade: "#C4B396", label: "Sand" },
  linen: { hex: "#EFE8DC", shade: "#DDD3C2", label: "Linen" },
  moss: { hex: "#5E6B45", shade: "#4A5536", label: "Moss" },
  clay: { hex: "#B5643C", shade: "#96502E", label: "Clay" },
  stone: { hex: "#8A8072", shade: "#73695C", label: "Stone" },
  sage: { hex: "#A9B49A", shade: "#919C82", label: "Sage" },
  ochre: { hex: "#C99A4B", shade: "#AD8136", label: "Ochre" },
}



const BG = ["#E8E0D2", "#EDE6DA", "#E4DCCD"]

const shapes = {
  hoodie: (c, s, d) => `
    <path d="M300 170c-46 0-78 22-90 58l-88 40c-26 12-40 36-44 64l-24 190c-2 16 10 28 26 28h52l10-150 8 0v258c0 18 14 30 30 30h240c16 0 30-12 30-30V430l8 0 10 150h52c16 0 28-12 26-28l-24-190c-4-28-18-52-44-64l-88-40c-12-36-44-58-90-58z" fill="${c}"/>
    <path d="M232 222c10-34 36-52 68-52s58 18 68 52c-14 26-38 42-68 42s-54-16-68-42z" fill="${s}"/>
    <path d="M300 264v70" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
    <path d="M286 268l-6 56M314 268l6 56" stroke="${d}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    <path d="M220 520h160c8 0 14 6 14 14v40H206v-40c0-8 6-14 14-14z" fill="${s}" opacity=".55"/>
    <rect x="186" y="700" width="228" height="26" rx="10" fill="${s}"/>`,
  zip_hoodie: (c, s, d) => shapes.hoodie(c, s, d) + `<path d="M300 268v458" stroke="${d}" stroke-width="4" stroke-dasharray="6 6"/>`,
  sweatshirt: (c, s) => `
    <path d="M300 200c-30 0-52-6-66-14l-112 64c-26 14-38 38-42 66l-24 196c-2 16 10 28 26 28h52l10-150 8 0v270c0 18 14 30 30 30h236c16 0 30-12 30-30V444l8 0 10 150h52c16 0 28-12 26-28l-24-196c-4-28-16-52-42-66l-112-64c-14 8-36 14-66 14z" fill="${c}"/>
    <path d="M234 186c18 18 40 26 66 26s48-8 66-26" stroke="${s}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <rect x="188" y="714" width="224" height="26" rx="10" fill="${s}"/>`,
  tee: (c, s) => `
    <path d="M300 214c-26 0-46-8-58-18l-112 50-48 110 74 30 26-44v352c0 18 14 30 30 30h176c16 0 30-12 30-30V342l26 44 74-30-48-110-112-50c-12 10-32 18-58 18z" fill="${c}"/>
    <path d="M242 196c14 18 34 28 58 28s44-10 58-28" stroke="${s}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
  shirt: (c, s, d) => `
    <path d="M300 196l-58-14-110 52c-24 12-36 34-40 60l-22 230c-2 16 10 28 26 28h48l14-170 4 0v290c0 16 14 30 30 30h216c16 0 30-14 30-30V382l4 0 14 170h48c16 0 28-12 26-28l-22-230c-4-26-16-48-40-60l-110-52z" fill="${c}"/>
    <path d="M242 182l58 64 58-64-22 66-36 14-36-14z" fill="${s}"/>
    <path d="M300 246v436" stroke="${d}" stroke-width="3"/>
    ${[290, 360, 430, 500, 570, 640].map((y) => `<circle cx="300" cy="${y}" r="6" fill="${d}"/>`).join("")}
    <rect x="190" y="320" width="70" height="80" rx="8" fill="${s}" opacity=".6"/>`,
  pants: (c, s) => `
    <path d="M196 170h208l26 590c0 12-10 22-22 22h-76c-12 0-20-8-22-20l-10-360-10 360c-2 12-10 20-22 20h-76c-12 0-22-10-22-22z" fill="${c}"/>
    <rect x="192" y="160" width="216" height="34" rx="8" fill="${s}"/>
    <path d="M300 194v130" stroke="${s}" stroke-width="5"/>`,
  cargo: (c, s) =>
    shapes.pants(c, s, s) +
    `<rect x="186" y="420" width="64" height="86" rx="10" fill="${s}" opacity=".7"/><rect x="350" y="420" width="64" height="86" rx="10" fill="${s}" opacity=".7"/>`,
  puffer: (c, s) => `
    <path d="M300 170c-40 0-74 10-92 26l-84 46c-26 14-40 40-44 70l-22 230c-2 18 12 32 30 32h44l14-160h6v290c0 16 14 30 30 30h236c16 0 30-14 30-30V414h6l14 160h44c18 0 32-14 30-32l-22-230c-4-30-18-56-44-70l-84-46c-18-16-52-26-92-26z" fill="${c}"/>
    ${[260, 340, 420, 500, 580, 660].map((y) => `<path d="M166 ${y}c90 18 178 18 268 0" stroke="${s}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join("")}
    <path d="M300 176v562" stroke="${s}" stroke-width="5"/>
    <path d="M238 168c20-24 40-32 62-32s42 8 62 32" stroke="${s}" stroke-width="22" fill="none" stroke-linecap="round"/>`,
  jacket: (c, s, d) => `
    <path d="M300 188l-62-18-106 54c-24 12-38 36-42 62l-22 226c-2 18 10 30 28 30h46l14-168h6v282c0 16 14 30 30 30h216c16 0 30-14 30-30V376h6l14 168h46c18 0 30-12 28-30l-22-226c-4-26-18-50-42-62l-106-54z" fill="${c}"/>
    <path d="M238 170l62 120 62-120 30 40-54 120h-76l-54-120z" fill="${s}"/>
    <path d="M300 290v440" stroke="${d}" stroke-width="3"/>
    ${[350, 430, 510, 590].map((y) => `<circle cx="300" cy="${y}" r="7" fill="${d}"/>`).join("")}
    <rect x="196" y="520" width="70" height="60" rx="6" fill="${s}" opacity=".6"/><rect x="334" y="520" width="70" height="60" rx="6" fill="${s}" opacity=".6"/>`,
  beanie: (c, s) => `
    <path d="M160 520c0-120 62-210 140-210s140 90 140 210z" fill="${c}"/>
    <rect x="146" y="500" width="308" height="96" rx="24" fill="${s}"/>
    ${[190, 230, 270, 310, 350, 390, 420].map((x) => `<path d="M${x} 512v72" stroke="${c}" stroke-width="6" opacity=".5"/>`).join("")}
    <circle cx="300" cy="296" r="34" fill="${s}"/>`,
  tote: (c, s) => `
    <path d="M230 300c0-70 30-110 70-110s70 40 70 110" stroke="${s}" stroke-width="18" fill="none"/>
    <path d="M170 300h260l24 430c0 14-10 24-24 24H170c-14 0-24-10-24-24z" fill="${c}"/>
    <text x="300" y="560" text-anchor="middle" font-family="Georgia,serif" font-size="56" fill="${s}">nemaya</text>`,
  giftcard: (c, s) => `
    <rect x="110" y="280" width="380" height="240" rx="28" fill="${c}"/>
    <rect x="270" y="280" width="34" height="240" fill="${s}"/>
    <path d="M287 280c-30-50-90-60-90-20 0 30 60 30 90 20zM287 280c30-50 90-60 90-20 0 30-60 30-90 20z" fill="${s}"/>
    <text x="140" y="490" font-family="Georgia,serif" font-size="40" fill="#F4EFE6">nemaya</text>`,
}

function garmentSvg(garment, colorKey, variant = 0) {
  const color = COLORS[colorKey] ?? COLORS.sand
  const bg = BG[variant % BG.length]
  const detail = colorKey === "bark" ? "#8A8072" : "#2A241D"
  // second image: slightly zoomed "detail" crop
  const transform = variant === 1 ? `transform="translate(-150 -120) scale(1.5)"` : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="${bg}"/><ellipse cx="300" cy="770" rx="210" ry="18" fill="#2A241D" opacity=".07"/><g ${transform}>${shapes[garment](color.hex, color.shade, detail)}</g></svg>`
}

const SIZES = ["S", "M", "L", "XL", "XXL"]

const PRODUCTS = [
  { title: "Essential Oversized Hoodie", handle: "essential-oversized-hoodie", garment: "hoodie", category: "Hoodies", collection: "Essentials", price: 89.99, sale: 59.99, colors: ["bark", "sand", "moss", "clay"], description: "Heavyweight brushed cotton in a relaxed, dropped-shoulder fit. Our most-loved layer — soft, structured and made to be lived in.", material: "100% organic cotton, 420gsm" },
  { title: "Earth Zip Hoodie", handle: "earth-zip-hoodie", garment: "zip_hoodie", category: "Hoodies", collection: "Earth Tones", price: 64.99, colors: ["stone", "bark", "sage"], description: "A full-zip hoodie with a tonal two-way zipper and deep kangaroo pockets.", material: "80% organic cotton, 20% recycled polyester" },
  { title: "Classic Crew Sweatshirt", handle: "classic-crew-sweatshirt", garment: "sweatshirt", category: "Hoodies", collection: "Essentials", price: 54.99, colors: ["sand", "moss", "bark"], description: "A clean crewneck with ribbed trims and a slightly boxy body.", material: "100% organic cotton fleece" },
  { title: "Heavyweight Boxy Tee", handle: "heavyweight-boxy-tee", garment: "tee", category: "Tops", collection: "Essentials", price: 32, colors: ["linen", "bark", "clay", "sage"], description: "Thick, dense jersey cut boxy with a tight collar that keeps its shape wash after wash.", material: "100% organic cotton, 260gsm" },
  { title: "Linen Overshirt", handle: "linen-overshirt", garment: "shirt", category: "Tops", collection: "Earth Tones", price: 74, colors: ["linen", "stone", "ochre"], description: "Breathable washed linen with a chest pocket and horn-look buttons. Wear it open as a light jacket.", material: "100% European flax linen" },
  { title: "Relaxed Cargo Pant", handle: "relaxed-cargo-pant", garment: "cargo", category: "Bottoms", collection: "Earth Tones", price: 79, sale: 63, colors: ["stone", "moss", "bark"], description: "Roomy through the leg with bellow pockets and an adjustable hem.", material: "Organic cotton ripstop" },
  { title: "Wide Leg Trouser", handle: "wide-leg-trouser", garment: "pants", category: "Bottoms", price: 69, colors: ["sand", "bark", "ochre"], description: "A soft-draping wide leg with a high rise and pressed front crease.", material: "Tencel™ lyocell blend" },
  { title: "Quilted Puffer Jacket", handle: "quilted-puffer-jacket", garment: "puffer", category: "Outerwear", collection: "Earth Tones", price: 139, colors: ["moss", "bark", "sand"], description: "Lightweight warmth with recycled insulation and a stand collar.", material: "Recycled nylon shell, recycled fill" },
  { title: "Corduroy Work Jacket", handle: "corduroy-work-jacket", garment: "jacket", category: "Outerwear", price: 118, colors: ["clay", "bark"], description: "Wide-wale corduroy chore jacket with patch pockets and a boxy cut.", material: "100% cotton corduroy" },
  { title: "Rib Knit Beanie", handle: "rib-knit-beanie", garment: "beanie", category: "Accessories", price: 24, colors: ["clay", "moss", "bark", "sand"], sizes: ["One size"], description: "Chunky rib knit with a fold-over cuff.", material: "Merino wool blend" },
  { title: "Canvas Market Tote", handle: "canvas-market-tote", garment: "tote", category: "Accessories", price: 28, colors: ["linen", "bark"], sizes: ["One size"], description: "Heavy canvas tote with long handles and an inner pocket.", material: "16oz organic cotton canvas" },
]

/** Category / collection copy used by the storefront (and seeded as metadata). */
const CATEGORIES = [
  { name: "Hoodies", handle: "hoodies", blurb: "Heavyweight fleece, built for layering." },
  { name: "Tops", handle: "tops", blurb: "Boxy tees and breathable overshirts." },
  { name: "Bottoms", handle: "bottoms", blurb: "Relaxed cuts with room to move." },
  { name: "Outerwear", handle: "outerwear", blurb: "Weather-ready layers in earthy tones." },
  { name: "Accessories", handle: "accessories", blurb: "The finishing pieces." },
]

const COLLECTIONS = [
  {
    title: "Essentials",
    handle: "essentials",
    description: "The pieces we reach for every day — dense cotton, quiet colours and cuts that only get better with wear.",
  },
  {
    title: "Earth Tones",
    handle: "earth-tones",
    description: "Our autumn drop, dyed in shades of moss, clay and stone. Made slow, in small runs.",
  },
]

module.exports = { COLORS, SIZES, PRODUCTS, CATEGORIES, COLLECTIONS, garmentSvg }
