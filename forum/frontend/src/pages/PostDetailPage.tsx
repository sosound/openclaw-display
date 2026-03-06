import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { postApi, replyApi, Post, Reply } from '@utils/api'
import { useAuth } from '@utils/auth'
import StatusIndicator from '@components/StatusIndicator'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (id) {
      loadPost()
      loadReplies()
    }
  }, [id])

  const loadPost = async () => {
    try {
      const response = await postApi.getById(id!)
      setPost(response.data)
    } catch (error) {
      console.error('Failed to load post:', error)
    }
  }

  const loadReplies = async () => {
    try {
      const response = await replyApi.getByPostId(id!)
      setReplies(response.data)
    } catch (error) {
      console.error('Failed to load replies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !id) return

    setSubmitting(true)
    try {
      await replyApi.create(id, replyContent)
      setReplyContent('')
      loadReplies()
      loadPost()
    } catch (error) {
      console.error('Failed to submit reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async () => {
    if (!id || !isAuthenticated) return
    try {
      await postApi.like(id)
      loadPost()
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }

  if (!post) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">帖子不存在</h3>
        <Link to="/" className="btn-primary mt-4 inline-block">
          返回首页
        </Link>
      </div>
    )
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: zhCN,
  })

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-accent transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回列表
      </Link>

      {/* Post Content */}
      <article className="card">
        <div className="flex items-start gap-4 mb-6">
          <Link to={`/profile/${post.author.id}`} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xl font-bold relative">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                post.author.username.charAt(0).toUpperCase()
              )}
              <div className="absolute -bottom-1 -right-1">
                <StatusIndicator status={post.author.status} size="md" />
              </div>
            </div>
          </Link>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link to={`/profile/${post.author.id}`} className="font-semibold text-gray-100 hover:text-accent transition-colors">
                {post.author.username}
              </Link>
              <StatusIndicator status={post.author.status} showLabel />
            </div>
            <div className="text-sm text-gray-500">
              发表于 {timeAgo} · {post.views} 次浏览
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {post.isPinned && (
            <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">置顶</span>
          )}
          {post.isLocked && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">锁定</span>
          )}
          <span className="px-2 py-1 bg-primary-light/50 text-accent-light text-xs font-medium rounded">
            {post.category}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">{post.title}</h1>

        <div className="prose prose-invert max-w-none mb-6">
          <div className="text-gray-300 whitespace-pre-wrap">{post.content}</div>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-dark-bg border border-dark-border rounded-full text-sm text-gray-400 hover:text-accent hover:border-accent/50 cursor-pointer transition-all">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-dark-border">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes}</span>
            </button>
            <span className="flex items-center gap-2 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.replies} 回复</span>
            </span>
          </div>
        </div>
      </article>

      {/* Replies */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-6">回复 ({replies.length})</h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-dark-border"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-dark-border rounded w-1/4"></div>
                  <div className="h-3 bg-dark-border rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : replies.length > 0 ? (
          <div className="space-y-6">
            {replies.map((reply) => (
              <div key={reply.id} className={`flex gap-4 ${reply.isAccepted ? 'bg-status-online/5 -mx-6 px-6 py-4 rounded-lg' : ''}`}>
                <Link to={`/profile/${reply.author.id}`} className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-sm font-bold">
                    {reply.author.avatar ? (
                      <img src={reply.author.avatar} alt={reply.author.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      reply.author.username.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to={`/profile/${reply.author.id}`} className="font-medium text-gray-200 hover:text-accent transition-colors">
                      {reply.author.username}
                    </Link>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: zhCN })}
                    </span>
                    {reply.isAccepted && (
                      <span className="px-2 py-0.5 bg-status-green/20 text-green-400 text-xs font-medium rounded">
                        ✓ 已采纳
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {reply.likes}
                    </button>
                    <button className="text-sm text-gray-500 hover:text-accent transition-colors">
                      回复
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            暂无回复，快来抢沙发吧！
          </div>
        )}

        {/* Reply Form */}
        {isAuthenticated && !post.isLocked && (
          <form onSubmit={handleSubmitReply} className="mt-6 pt-6 border-t border-dark-border">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              className="input-field w-full min-h-[120px] resize-y mb-4"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '发送中...' : '发布回复'}
              </button>
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-dark-border text-center">
            <Link to="/login" className="text-accent hover:underline">
              登录
            </Link>
            {' '}后才能回复
          </div>
        )}

        {post.isLocked && (
          <div className="mt-6 pt-6 border-t border-dark-border text-center text-gray-400">
            此帖子已锁定，无法回复
          </div>
        )}
      </div>
    </div>
  )
}
