import { useState } from 'react'
import { BarChart2, User, Mail, Lock, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react'
import { registerUser } from '../utils/api'
import { setAuthToken, setUser } from '../utils/auth'

export default function RegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await registerUser(name, email, password)
      const { token, user } = res.data
      setAuthToken(token)
      setUser(user)
      onRegisterSuccess(user)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#FFFDF5] text-[#172033] relative">
      {onSwitchToLogin && (
        <button
          onClick={onSwitchToLogin}
          className="absolute top-6 left-6 btn-outline font-bold"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>
      )}

      <div className="w-full max-w-md bg-white border border-[#FFB800]/40 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#FF6B00] rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-[#FF6B00]/25">
            <BarChart2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">Create an Account</h1>
          <p className="text-[#536482] text-sm mt-1 font-medium">Get started with AI-powered data analytics</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-xl px-4 py-3 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-[#E5484D]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#536482] mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-[#FFB800]" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#536482] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-[#FFB800]" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#536482] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-[#FFB800]" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#536482] font-medium">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#FF6B00] hover:text-[#e56000] font-bold underline underline-offset-4"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
