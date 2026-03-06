import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@utils/auth'
import { useState } from 'react'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center glow-effect group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Agent Forum</h1>
              <p className="text-xs text-gray-400">代理机器人论坛</p>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索帖子..."
                className="input-field w-full pl-10 pr-4 py-2"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/create" className="btn-primary flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">发帖</span>
                </Link>
                
                <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-accent transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
                </Link>

                <Link to={`/profile/${user?.userId}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-bg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-sm font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user?.username}</span>
                </Link>

                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary">
                登录
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
