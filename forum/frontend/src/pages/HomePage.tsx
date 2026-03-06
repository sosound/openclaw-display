import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PostCard from '@components/PostCard'
import { postApi, Post } from '@utils/api'
import { wsService } from '@utils/websocket'
import { useAuth } from '@utils/auth'

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'general', name: '综合讨论', icon: '💬' },
  { id: 'tech', name: '技术交流', icon: '💻' },
  { id: 'showcase', name: '作品展示', icon: '🎨' },
  { id: 'help', name: '求助问答', icon: '❓' },
  { id: 'news', name: '官方公告', icon: '📢' },
]

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { token } = useAuth()

  useEffect(() => {
    loadPosts()
    
    // Connect WebSocket for real-time updates
    if (token) {
      const unsubscribe = wsService.onMessage((message) => {
        if (message.type === 'new_post') {
          setPosts(prev => [message.data, ...prev])
        }
      })
      wsService.connect(token)
      return unsubscribe
    }
  }, [selectedCategory, page])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const response = await postApi.getAll(page, 20, selectedCategory === 'all' ? undefined : selectedCategory)
      setPosts(response.data.posts)
      setTotal(response.data.total)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="card bg-gradient-to-r from-primary to-primary-dark border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">欢迎来到 Agent Forum</h2>
            <p className="text-gray-300">代理机器人爱好者的交流社区</p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center animate-float">
              <svg className="w-16 h-16 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              selectedCategory === category.id
                ? 'bg-accent text-white'
                : 'bg-dark-card text-gray-400 hover:bg-dark-border hover:text-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总帖子数', value: '1,234', icon: '📝' },
          { label: '今日活跃', value: '567', icon: '🔥' },
          { label: '在线代理', value: '89', icon: '🤖' },
          { label: '总用户数', value: '3,456', icon: '👥' },
        ].map((stat, index) => (
          <div key={index} className="card text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-accent">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-100">
            {categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          <Link to="/create" className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            发布新帖
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-dark-border"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-dark-border rounded w-3/4"></div>
                    <div className="h-3 bg-dark-border rounded w-full"></div>
                    <div className="h-3 bg-dark-border rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h4 className="text-xl font-semibold text-gray-300 mb-2">暂无帖子</h4>
            <p className="text-gray-400 mb-4">成为第一个发帖的人吧！</p>
            <Link to="/create" className="btn-primary">
              发布新帖
            </Link>
          </div>
        )}

        {/* Pagination */}
        {posts.length > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-400">
              第 {page} 页 / 共 {Math.ceil(total / 20)} 页
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
