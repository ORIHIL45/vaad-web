import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

// Israeli mobile: 05X-XXXXXXX or 07X-XXXXXXX (10 digits)
function isValidIsraeliPhone(phone) {
  return /^0[57]\d{8}$/.test(phone)
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.18 }}
          className="text-red-500 text-xs mt-1.5 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className={`relative flex items-center rounded-xl border bg-gray-50 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-offset-0 ${error ? 'border-red-400 focus-within:ring-red-300' : 'border-gray-200 focus-within:ring-blue-500 focus-within:border-transparent'}`}>
        <span className="absolute right-3 text-gray-400 pointer-events-none">
          <Icon />
        </span>
        {children}
      </div>
      <FieldError message={error} />
    </div>
  )
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [buildingCode, setBuildingCode] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { login } = useAuth()

  const clearError = (field) => setErrors(prev => ({ ...prev, [field]: '' }))

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
    clearError('phone')
  }

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
    setBuildingCode(val)
    clearError('building')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    clearError('password')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!phone) {
      newErrors.phone = 'יש להזין מספר טלפון'
    } else if (!isValidIsraeliPhone(phone)) {
      newErrors.phone = 'מספר לא תקין — יש להזין מספר ישראלי (05X או 07X)'
    }

    if (!buildingCode) {
      newErrors.building = 'יש להזין קוד בניין'
    } else if (buildingCode.length < 4) {
      newErrors.building = 'קוד הבניין חייב להכיל לפחות 4 ספרות'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const q = query(collection(db, 'buildingUsers'), where('phone', '==', phone))
      const snap = await getDocs(q)

      if (snap.empty) {
        setErrors({ phone: 'מספר הטלפון לא רשום במערכת' })
        setLoading(false)
        return
      }

      const userData = { id: snap.docs[0].id, ...snap.docs[0].data() }

      if (userData.buildingCode !== buildingCode) {
        setErrors({ building: 'קוד הבניין אינו תואם לחשבון זה' })
        setLoading(false)
        return
      }

      if (userData.password && userData.password !== password) {
        setErrors({ password: 'הסיסמה שגויה' })
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => login(userData), 900)
    } catch {
      setErrors({ general: 'שגיאה בחיבור לשרת — נסה שוב' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-4">
            <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="20" width="40" height="24" rx="2" fill="white" fillOpacity="0.15" />
              <path d="M8 20L24 6L40 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="18" y="30" width="12" height="14" rx="1.5" fill="white" fillOpacity="0.4" />
              <rect x="10" y="26" width="7" height="7" rx="1" fill="white" fillOpacity="0.5" />
              <rect x="31" y="26" width="7" height="7" rx="1" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ועד הבית</h1>
          <p className="text-blue-200/80 text-sm mt-1 font-light">ניהול בניין חכם ומודרני</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-6 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-0.5">כניסה לאזור האישי</h2>
          <p className="text-gray-400 text-sm mb-6">הזן את פרטיך להתחברות</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <Field label="מספר טלפון" icon={PhoneIcon} error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="05X-XXXXXXX"
                autoComplete="tel"
                dir="ltr"
                disabled={loading || success}
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-transparent text-gray-800 placeholder-gray-400 text-base focus:outline-none"
              />
            </Field>

            <Field label="קוד בניין" icon={KeyIcon} error={errors.building}>
              <input
                type="text"
                inputMode="numeric"
                value={buildingCode}
                onChange={handleCodeChange}
                placeholder="קוד 4–6 ספרות"
                disabled={loading || success}
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-transparent text-gray-800 placeholder-gray-400 text-base focus:outline-none"
              />
            </Field>

            <Field label="סיסמה" icon={LockIcon} error={errors.password}>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="סיסמה (אם הוגדרה)"
                disabled={loading || success}
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-transparent text-gray-800 placeholder-gray-400 text-base focus:outline-none"
              />
            </Field>

            {/* General error */}
            <FieldError message={errors.general} />

            {/* Submit / Success button */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileTap={!loading && !success ? { scale: 0.97 } : {}}
              className={`w-full py-3.5 mt-1 rounded-xl font-semibold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                ${success
                  ? 'bg-emerald-500 shadow-emerald-200 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-60'
                }`}
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <CheckIcon />
                    כניסה מוצלחת!
                  </motion.span>
                ) : loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    מתחבר...
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
                    כניסה
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-white/30 text-xs mt-6">ועד הבית © 2025</p>
      </motion.div>
    </div>
  )
}
