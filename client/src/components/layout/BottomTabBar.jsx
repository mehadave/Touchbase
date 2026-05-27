import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Network, Calendar, Settings, StickyNote } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const tabs = [
  { to: '/',         icon: LayoutDashboard, label: 'Home'     },
  { to: '/contacts', icon: Users,           label: 'Contacts' },
  { to: '/network',  icon: Network,         label: 'Network'  },
  { to: '/notes',    icon: StickyNote,      label: 'Notes'    },
  { to: '/calendar', icon: Calendar,        label: 'Calendar' },
  { to: '/settings', icon: Settings,        label: 'Settings' },
]

// Soap-bubble iridescent border: dark fill + rainbow conic-gradient border
const BUBBLE_BG =
  'linear-gradient(rgba(15,15,20,0.72), rgba(15,15,20,0.72)) padding-box, ' +
  'conic-gradient(from 0deg, #f472b6, #818cf8, #22d3ee, #34d399, #fbbf24, #fb923c, #f472b6) border-box'

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()

  const activeIndex = tabs.findIndex(({ to }) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)
  )

  // bubbleIdx tracks where the visual indicator sits
  const [bubbleIdx, setBubbleIdx] = useState(activeIndex)
  // phase: 'idle' | 'pop' | 'travel'
  const [phase, setPhase]         = useState('idle')
  const timers = useRef([])

  // Keep bubble in sync for back/forward navigation
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    setBubbleIdx(activeIndex)
    setPhase('idle')
  }, [activeIndex])

  const handlePress = (idx, to) => {
    if (idx === activeIndex) return
    timers.current.forEach(clearTimeout)

    // 1. Pop — bubble expands in place
    setPhase('pop')

    timers.current = [
      // 2. Travel — bubble slides to new slot (starts after brief expand)
      setTimeout(() => {
        setBubbleIdx(idx)
        setPhase('travel')
      }, 110),

      // 3. Land — bubble collapses back to pill & navigate
      setTimeout(() => {
        navigate(to)
        setPhase('idle')
      }, 390),
    ]
  }

  const n          = tabs.length
  const isPopped   = phase === 'pop' || phase === 'travel'

  // Bubble geometry
  const idleH  = 50   // px — pill height
  const popH   = 68   // px — expanded circle diameter
  const h      = isPopped ? popH   : idleH
  const scale  = isPopped ? 1.14   : 1
  const radius = isPopped ? '50%'  : '18px'
  const bg     = isPopped ? BUBBLE_BG : '#18181b'
  const border = isPopped ? '2.5px solid transparent' : 'none'

  const leftVal = `calc(${bubbleIdx} * 100% / ${n})`
  const widthVal = `calc(100% / ${n})`

  // Left only transitions during 'travel'; no transition on 'idle' (snap on external nav)
  const transition = [
    `left ${phase === 'travel' ? '270ms' : '0ms'} cubic-bezier(0.34, 1.56, 0.64, 1)`,
    'height 170ms ease',
    'border-radius 170ms ease',
    'transform 170ms ease',
    'background 80ms ease',
  ].join(', ')

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-4 mb-4">
        {/* Outer dark pill */}
        <div
          className="relative flex bg-gray-900/90 backdrop-blur-2xl rounded-[28px] border border-white/[0.07] shadow-2xl shadow-black/60"
          style={{ padding: 6 }}
        >
          {/* ── Sliding bubble indicator ── */}
          <div
            aria-hidden
            style={{
              position:    'absolute',
              left:        leftVal,
              width:       widthVal,
              height:      h,
              top:         '50%',
              transform:   `translateY(-50%) scale(${scale})`,
              borderRadius: radius,
              border,
              background:  bg,
              transition,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* ── Tab buttons ── */}
          {tabs.map(({ to, icon: Icon, label }, i) => {
            const isActive = i === activeIndex
            return (
              <button
                key={to}
                onClick={() => handlePress(i, to)}
                aria-label={label}
                style={{ height: idleH }}
                className="relative flex-1 flex flex-col items-center justify-center gap-[3px] focus:outline-none"
              >
                {/* Inactive: subtle circular grey tint */}
                {!isActive && (
                  <div
                    aria-hidden
                    className="absolute rounded-full bg-white/[0.06]"
                    style={{ inset: 5 }}
                  />
                )}

                <Icon
                  size={isActive ? 21 : 19}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ position: 'relative', zIndex: 2, transition: 'color 200ms' }}
                  className={isActive ? 'text-white' : 'text-gray-500'}
                />

                {/* Label only on active tab */}
                <span
                  style={{
                    position:   'relative',
                    zIndex:     2,
                    fontSize:   10,
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                    maxHeight:  isActive ? 12 : 0,
                    opacity:    isActive ? 1  : 0,
                    overflow:   'hidden',
                    transition: 'max-height 220ms ease, opacity 180ms ease',
                    color:      'white',
                  }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
