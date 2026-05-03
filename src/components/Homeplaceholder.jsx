import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Homeplaceholder() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-8 shadow-lg max-w-sm w-full"
      >
        <div className="text-5xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ברוך הבא!</h1>
        <p className="text-gray-500 text-sm mb-2">
          מחובר עם: <span className="font-medium text-blue-600 dir-ltr">{user?.phone}</span>
        </p>
        <p className="text-gray-400 text-xs mb-6">הדשבורד יבנה בשלב הבא</p>
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          התנתקות
        </button>
      </motion.div>
    </div>
  )
}
