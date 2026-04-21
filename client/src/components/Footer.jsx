import { useUIStore } from '../store/useUIStore.js'

export default function Footer({ forceDark }) {
  const { darkMode: storeDark } = useUIStore()
  const darkMode = forceDark ?? storeDark

  const color      = darkMode ? 'rgba(255,255,255,0.28)' : 'rgba(11,20,55,0.52)'
  const hoverColor = darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(11,20,55,0.8)'
  const borderColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(11,20,55,0.12)'

  return (
    <footer
      className="w-full flex flex-col items-center gap-1 px-4 text-center"
      style={{ paddingTop: 14, paddingBottom: 20, color, fontSize: 11, borderTop: `1px solid ${borderColor}` }}
    >
      <p>Made with ❤️ in California</p>
      <p>Copyright © Touchbase 2026. All rights reserved.</p>
      <a
        href="mailto:davemeha60@gmail.com"
        className="transition-colors duration-200 hover:underline"
        style={{ color }}
        onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
        onMouseLeave={e => (e.currentTarget.style.color = color)}
      >
        Contact
      </a>
    </footer>
  )
}
