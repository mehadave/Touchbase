import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Network, Calendar, Settings, StickyNote } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

const tabs = [
  { to: '/',         icon: LayoutDashboard, label: 'Home'     },
  { to: '/contacts', icon: Users,           label: 'Contacts' },
  { to: '/network',  icon: Network,         label: 'Network'  },
  { to: '/notes',    icon: StickyNote,      label: 'Notes'    },
  { to: '/calendar', icon: Calendar,        label: 'Calendar' },
  { to: '/settings', icon: Settings,        label: 'Settings' },
]

const POP_BORDER = '1.5px solid rgba(150, 150, 160, 0.25)'

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const dark         = useDark()

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

  // Bubble geometry — colours adapt to light / dark mode
  const idleH    = 50
  const popH     = 68
  const h        = isPopped ? popH  : idleH
  const scale    = isPopped ? 1.14  : 1
  const radius   = isPopped ? '50%' : '18px'
  const idleBg   = dark ? '#18181b' : 'rgba(0,0,0,0.08)'
  const popBg    = dark ? 'rgba(18,18,22,0.68)' : 'rgba(255,255,255,0.55)'
  const bg       = isPopped ? popBg   : idleBg
  const border   = isPopped ? POP_BORDER : 'none'

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
          className="relative flex bg-white/70 dark:bg-gray-900/88 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] shadow-xl shadow-black/10 dark:shadow-black/60"
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
                <Icon
                  size={isActive ? 21 : 19}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    position: 'relative', zIndex: 2, transition: 'color 200ms',
                    color: isActive
                      ? (dark ? 'white' : '#111827')
                      : (dark ? '#6b7280' : '#9ca3af'),
                  }}
                />

                <span
                  style={{
                    position:      'relative',
                    zIndex:        2,
                    fontSize:      10,
                    fontWeight:    isActive ? 600 : 500,
                    lineHeight:    1,
                    letterSpacing: '-0.01em',
                    color: isActive
                      ? (dark ? 'white'   : '#111827')
                      : (dark ? '#6b7280' : '#9ca3af'),
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
