import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

// ── helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'בוקר טוב'
  if (h < 17) return 'צהריים טובים'
  if (h < 21) return 'ערב טוב'
  return 'לילה טוב'
}

function getInitials(user) {
  if (user?.userName) {
    return user.userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }
  return user?.phone?.slice(-2) ?? '?'
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] },
})

// ── main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [issueCount, setIssueCount]     = useState(null)
  const [messageCount, setMessageCount] = useState(null)
  const [alertCount, setAlertCount]     = useState(null)

  const bc          = user?.buildingCode
  const displayName = user?.userName ?? user?.phone ?? ''
  const initials    = getInitials(user)
  const greeting    = getGreeting()

  useEffect(() => {
    if (!bc) return
    const q = query(
      collection(db, 'issues'),
      where('buildingCode', '==', bc),
      where('status', '==', 'פתוח'),
    )
    return onSnapshot(q, snap => setIssueCount(snap.size))
  }, [bc])

  useEffect(() => {
    if (!bc) return
    const q = query(collection(db, 'messages'), where('buildingCode', '==', bc))
    return onSnapshot(q, snap => setMessageCount(snap.size))
  }, [bc])

  useEffect(() => {
    if (!bc) return
    const q = query(
      collection(db, 'alerts'),
      where('buildingCode', '==', bc),
      where('isActive', '==', true),
    )
    return onSnapshot(q, snap => setAlertCount(snap.size))
  }, [bc])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col min-h-screen relative">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 pt-12 pb-8 px-5 rounded-b-[2rem] shadow-xl shadow-blue-300/30">
          <div className="flex items-center justify-between mb-6">
            {/* Logout */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="התנתק"
            >
              <LogoutIcon className="w-5 h-5 text-white" />
            </motion.button>

            {/* Title */}
            <div className="text-center">
              <p className="text-blue-200 text-xs font-medium">בניין {bc}</p>
              <h1 className="text-white text-lg font-bold leading-tight">ועד הבית</h1>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          </div>

          {/* Welcome card */}
          <motion.div
            {...fadeUp(0.05)}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-4"
          >
            <p className="text-blue-100 text-sm">{greeting} 👋</p>
            <p className="text-white text-xl font-bold mt-0.5 leading-tight">{displayName}</p>
            <p className="text-blue-200/70 text-xs mt-1">קוד בניין: {bc}</p>
          </motion.div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-28 px-4 pt-5 space-y-4">

          {/* Issues — full-width prominent card */}
          <motion.div {...fadeUp(0.1)}>
            <SectionLabel>תקלות ותחזוקה</SectionLabel>
            <FeatureCard
              icon={<WrenchIcon className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              title="תקלות פתוחות"
              count={issueCount}
              countColor="text-orange-500"
              subtitle={issueCount === 0 ? 'הכל תקין — אין תקלות פתוחות' : `${issueCount} תקל${issueCount === 1 ? 'ה' : 'ות'} ממתינ${issueCount === 1 ? 'ה' : 'ות'} לטיפול`}
              accent="border-r-orange-400"
              pill={issueCount > 0 ? { label: 'דורש טיפול', color: 'bg-orange-100 text-orange-600' } : { label: 'תקין', color: 'bg-emerald-100 text-emerald-600' }}
            />
          </motion.div>

          {/* Messages + Alerts — 2-column */}
          <motion.div {...fadeUp(0.18)}>
            <SectionLabel>תקשורת</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <SmallCard
                icon={<ChatIcon className="w-5 h-5 text-blue-500" />}
                iconBg="bg-blue-50"
                title="הודעות"
                count={messageCount}
                countColor="text-blue-600"
                sub="בקבוצה"
              />
              <SmallCard
                icon={<MegaphoneIcon className="w-5 h-5 text-purple-500" />}
                iconBg="bg-purple-50"
                title="הכרזות"
                count={alertCount}
                countColor="text-purple-600"
                sub="פעילות"
              />
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div {...fadeUp(0.26)}>
            <SectionLabel>פעולות מהירות</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {ACTIONS.map(({ label, bg, icon: Icon, color }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.28 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.93 }}
                  className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all active:bg-gray-50"
                >
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Building info card */}
          <motion.div {...fadeUp(0.34)}>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <BuildingIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-gray-800">הבניין שלי</p>
                <p className="text-xs text-gray-400 mt-0.5">קוד: {bc}</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-1 rounded-full">
                פעיל
              </span>
            </div>
          </motion.div>

        </div>

        {/* ── Bottom nav ──────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-2xl px-2 pb-2">
          <div className="flex items-center justify-around pt-2">
            {NAV.map(({ id, label, Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors"
                >
                  <AnimatePresence>
                    <motion.div
                      animate={{ backgroundColor: active ? '#2563eb' : 'transparent' }}
                      transition={{ duration: 0.2 }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl"
                    >
                      <Icon className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-white' : 'text-gray-400'}`} />
                    </motion.div>
                  </AnimatePresence>
                  <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-0.5">{children}</p>
}

function CountDisplay({ count, color }) {
  if (count === null) {
    return <div className="w-8 h-7 bg-gray-100 rounded-lg animate-pulse" />
  }
  return <span className={`text-3xl font-extrabold leading-none ${color}`}>{count}</span>
}

function FeatureCard({ icon, iconBg, title, count, countColor, subtitle, accent, pill }) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm border-r-4 ${accent} flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 text-right">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pill.color}`}>{pill.label}</span>
          <CountDisplay count={count} color={countColor} />
        </div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <ChevronIcon className="w-4 h-4 text-gray-300 shrink-0 rotate-180" />
    </motion.div>
  )
}

function SmallCard({ icon, iconBg, title, count, countColor, sub }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <ChevronIcon className="w-4 h-4 text-gray-200 rotate-180" />
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>{icon}</div>
      </div>
      <div className="text-right">
        <CountDisplay count={count} color={countColor} />
        <p className="text-sm font-bold text-gray-800 mt-0.5">{title}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </motion.div>
  )
}

// ── data ───────────────────────────────────────────────────────────────────────

const ACTIONS = [
  { label: "צ'אט",    bg: 'bg-blue-50',    icon: ChatIcon,       color: 'text-blue-500' },
  { label: 'הצבעות',  bg: 'bg-purple-50',  icon: VoteIcon,       color: 'text-purple-500' },
  { label: 'תשלומים', bg: 'bg-pink-50',    icon: CreditCardIcon, color: 'text-pink-500' },
  { label: 'דיירים',  bg: 'bg-teal-50',    icon: UsersIcon,      color: 'text-teal-500' },
  { label: 'מתקנים',  bg: 'bg-amber-50',   icon: CalendarIcon,   color: 'text-amber-500' },
  { label: 'הגדרות',  bg: 'bg-gray-100',   icon: GearIcon,       color: 'text-gray-500' },
]

const NAV = [
  { id: 'home',    label: 'בית',    Icon: HomeIcon },
  { id: 'chat',    label: "צ'אט",   Icon: ChatIcon },
  { id: 'issues',  label: 'תקלות',  Icon: WrenchIcon },
  { id: 'profile', label: 'פרופיל', Icon: UserIcon },
]

// ── icons ──────────────────────────────────────────────────────────────────────

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
function WrenchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function MegaphoneIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  )
}
function VoteIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}
function CreditCardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function GearIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}
function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
function BuildingIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
function ChevronIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
