// Run: node create-icons.mjs
// Requires: npm install -D @resvg/resvg-js
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#FEF3C7"/>
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#EF4444"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FBBF24" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#F97316" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <circle cx="192" cy="256" r="150" fill="url(#g1)"/>
  <circle cx="320" cy="256" r="150" fill="url(#g2)"/>
  <path d="M 192 256 Q 213 192 256 256 Q 299 320 320 256" stroke="white" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="192" cy="256" r="20" fill="white" opacity="0.9"/>
  <circle cx="320" cy="256" r="20" fill="white" opacity="0.9"/>
</svg>`

// 512x512
const resvg512 = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } })
writeFileSync('public/icon-512.png', resvg512.render().asPng())
console.log('✓ icon-512.png')

// 192x192
const resvg192 = new Resvg(svg, { fitTo: { mode: 'width', value: 192 } })
writeFileSync('public/icon-192.png', resvg192.render().asPng())
console.log('✓ icon-192.png')

// 180x180 apple touch
const resvg180 = new Resvg(svg, { fitTo: { mode: 'width', value: 180 } })
writeFileSync('public/apple-touch-icon.png', resvg180.render().asPng())
console.log('✓ apple-touch-icon.png')
