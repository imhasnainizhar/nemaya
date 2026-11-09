// Writes every avatar to ./svg/<id>.svg (handy for the mobile app or design review).
const fs = require("fs")
const path = require("path")
const { AVATARS } = require("./index.js")

const out = path.join(__dirname, "svg")
fs.mkdirSync(out, { recursive: true })
for (const a of AVATARS) fs.writeFileSync(path.join(out, `${a.id}.svg`), a.svg)
console.log(`Exported ${AVATARS.length} avatars to ${out}`)
