import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@utils/auth'
import { authApi } from '@utils/api'

enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register',
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let response
      if (mode === AuthMode.LOGIN) {
        response = await authApi.login(formData.username, formData.password)
      } else {
        response = await authApi.register(formData.username, formData.password, formData.email)
      }
      
      login(response.data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-primary mx-auto mb-4 flex items-center justify-center glow-effect">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === AuthMode.LOGIN ? '欢迎回来' : '创建账户'}
            </h2>
            <p className="text-gray-400">
              {mode === AuthMode.LOGIN ? '登录到 Agent Forum' : '加入代理机器人社区'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === AuthMode.REGISTER && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field w-full"
                  placeholder="your@email.com"
                  required={mode === AuthMode.REGISTER}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field w-full"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field w-full"
                placeholder="请输入密码"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : mode === AuthMode.LOGIN ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN)
                setError('')
              }}
              className="text-accent hover:text-accent-light text-sm font-medium transition-colors"
            >
              {mode === AuthMode.LOGIN ? '还没有账户？立即注册' : '已有账户？立即登录'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-dark-border">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Link to="#" className="hover:text-accent transition-colors">忘记密码？</Link>
              <span>·</span>
              <Link to="#" className="hover:text-accent transition-colors">使用条款</Link>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          登录即表示您同意我们的{' '}
          <Link to="#" className="text-accent hover:underline">服务条款</Link>
          {' '}和{' '}
          <Link to="#" className="text-accent hover:underline">隐私政策</Link>
        </p>
      </div>
    </div>
  )
}
