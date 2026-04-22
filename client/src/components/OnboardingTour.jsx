import { useState, useEffect } from 'react'
import { X, ArrowRight, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Touchbase! 👋',
    body: 'Your personal CRM for staying connected with the people who matter. Let\'s take a quick tour — it\'ll only take 30 seconds.',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Your Daily Touchbase',
    body: 'Every day, Touchbase suggests one person for you to reach out to, with a personalised message template. Just one contact a day keeps relationships alive.',
    target: '[data-tour="dashboard"]',
    position: 'right',
  },
  {
    id: 'contacts',
    title: 'Add Your Contacts',
    body: 'Build your network by adding contacts. You can import from CSV, add manually, or paste a LinkedIn screenshot to auto-fill details.',
    target: '[data-tour="contacts"]',
    position: 'right',
  },
  {
    id: 'streak',
    title: 'Build Your Streak 🔥',
    body: 'Mark one touchbase as done each day to build your streak. Consistency is the secret to strong relationships.',
    target: '[data-tour="streak"]',
    position: 'right',
  },
  {
    id: 'notes',
    title: 'Capture Notes',
    body: 'Jot down meeting notes, ideas, and follow-ups. Link them to contacts so you never forget important context.',
    target: '[data-tour="notes"]',
    position: 'right',
  },
  {
    id: 'done',
    title: 'You\'re all set! 🎉',
    body: 'Start by adding your first contact. Touchbase will take care of the rest — reminding you when to reach out and tracking your progress.',
    position: 'center',
  },
]

const STORAGE_KEY = 'touchbase-tour-count'
const MAX_SHOWS = 5

export default function OnboardingTour() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || '0')
    if (count < MAX_SHOWS) {
      localStorage.setItem(STORAGE_KEY, String(count + 1))
      const t = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
  }

  const next = () => {
    if (step >= STEPS.length - 1) { dismiss(); return }
    setStep(s => s + 1)
  }

  if (!visible) return null

  const current = STEPS[step]
  const isCenter = current.position === 'center'
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Tour card */}
      <div className={`
        fixed z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5
        ${isCenter
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-72 md:translate-x-0'
        }
        animate-fade-in
      `}>
        {/* Progress dots */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${
              i === step ? 'bg-amber-500 w-6' : i < step ? 'bg-amber-200 dark:bg-amber-800 w-3' : 'bg-gray-200 dark:bg-gray-700 w-3'
            }`} />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 pr-6">
          {current.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
          {current.body}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLast ? (
              <><CheckCircle size={14} /> Get started</>
            ) : (
              <>{isFirst ? 'Start tour' : 'Next'} <ArrowRight size={14} /></>
            )}
          </button>
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-gray-300 dark:text-gray-600 mt-3">
          {step + 1} of {STEPS.length}
        </p>
      </div>
    </>
  )
}
