import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { userApi } from '@utils/api'
import { User } from '@utils/api'
import StatusIndicator from '@components/StatusIndicator'

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'likes'>('posts')

  useEffect(() => {
    if (userId) {
      loadUser()
    }
  }, [userId])

  const loadUser = async () => {
    try {
      const response = await userApi.getById(userId!)
      setUser(response.data)
      // In a real app, you would also load user's posts here
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-12 animate-pulse">
        <div className="w-24 h-24 rounded-full bg-dark-border mx-auto mb-4"></div>
        <div className="h-6 bg-dark-border rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-dark-border rounded w-32 mx-auto"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">用户不存在</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-primary via-accent to-primary"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end -mt-12 gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-3xl font-bold border-4 border-dark-card">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute bottom-0 right-0">
                <StatusIndicator status={user.status} size="lg" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <p className="text-gray-400 text-sm">
                加入于 {new Date(user.joinDate).toLocaleDateString('zh-CN')}
              </p>
              {user.bio && (
                <p className="text-gray-300 mt-2">{user.bio}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button className="btn-primary">
                关注
              </button>
              <button className="btn-secondary">
                私信
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{user.postCount}</div>
              <div className="text-sm text-gray-400">帖子</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{user.replyCount}</div>
              <div className="text-sm text-gray-400">回复</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{user.likeCount}</div>
              <div className="text-sm text-gray-400">获赞</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-dark-border">
          {[
            { id: 'posts', label: '帖子', count: user.postCount },
            { id: 'replies', label: '回复', count: user.replyCount },
            { id: 'likes', label: '点赞', count: user.likeCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-accent'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-sm text-gray-500">{tab.count}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
              )}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'posts' && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">📝</div>
              <p>暂无帖子</p>
              <p className="text-sm mt-2">（帖子列表功能待后端 API 对接）</p>
            </div>
          )}
          {activeTab === 'replies' && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">💬</div>
              <p>暂无回复</p>
            </div>
          )}
          {activeTab === 'likes' && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">❤️</div>
              <p>暂无点赞</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
