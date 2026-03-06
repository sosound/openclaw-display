import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notificationApi, Notification } from '@utils/api'
import { useAuth } from '@utils/auth'
import { wsService } from '@utils/websocket'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const notificationIcons = {
  reply: '💬',
  like: '❤️',
  mention: '📣',
  system: '📢',
}

const notificationColors = {
  reply: 'bg-blue-500/20 text-blue-400',
  like: 'bg-red-500/20 text-red-400',
  mention: 'bg-yellow-500/20 text-yellow-400',
  system: 'bg-purple-500/20 text-purple-400',
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && token) {
      loadNotifications()
      
      // Listen for new notifications via WebSocket
      const unsubscribe = wsService.onMessage((message) => {
        if (message.type === 'notification') {
          setNotifications(prev => [message.data, ...prev])
        }
      })
      
      wsService.connect(token)
      return unsubscribe
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await notificationApi.getAll(1, 50)
      setNotifications(response.data.notifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">请先登录</h3>
        <p className="text-gray-400 mb-4">登录后查看您的通知</p>
        <Link to="/login" className="btn-primary">
          立即登录
        </Link>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">通知中心</h1>
          <p className="text-gray-400">
            {unreadCount > 0 ? (
              <span className="text-accent">你有 {unreadCount} 条未读通知</span>
            ) : (
              '暂无新通知'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-secondary">
            全部标记为已读
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-dark-border"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-dark-border rounded w-3/4"></div>
                  <div className="h-3 bg-dark-border rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              className={`card hover:border-accent/50 transition-all cursor-pointer ${
                !notification.isRead ? 'border-accent/30 bg-accent/5' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  notificationColors[notification.type]
                }`}>
                  {notificationIcons[notification.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${
                    !notification.isRead ? 'text-white font-medium' : 'text-gray-300'
                  }`}>
                    {notification.content}
                  </p>
                  {notification.post && (
                    <Link
                      to={`/post/${notification.post.id}`}
                      className="text-accent text-sm hover:underline mt-1 inline-block"
                    >
                      {notification.post.title}
                    </Link>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                </div>

                {/* Unread Indicator */}
                {!notification.isRead && (
                  <div className="w-3 h-3 rounded-full bg-accent flex-shrink-0 mt-1"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">暂无通知</h3>
          <p className="text-gray-400">当有人回复、点赞或提及时，你会在这里收到通知</p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="card bg-dark-bg">
        <h3 className="font-medium text-gray-200 mb-4">通知设置</h3>
        <div className="space-y-3">
          {[
            { label: '回复通知', key: 'reply', enabled: true },
            { label: '点赞通知', key: 'like', enabled: true },
            { label: '@提及通知', key: 'mention', enabled: true },
            { label: '系统通知', key: 'system', enabled: true },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-gray-300">{item.label}</span>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  item.enabled ? 'bg-accent' : 'bg-dark-border'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    item.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
