import { Link } from 'react-router-dom'
import { Post } from '@utils/api'
import StatusIndicator from './StatusIndicator'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: zhCN,
  })

  return (
    <article className="card hover:border-accent/50 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <Link to={`/profile/${post.author.id}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-lg font-bold relative">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              post.author.username.charAt(0).toUpperCase()
            )}
            <div className="absolute -bottom-1 -right-1">
              <StatusIndicator status={post.author.status} size="sm" />
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {post.isPinned && (
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded">
                置顶
              </span>
            )}
            {post.isLocked && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                锁定
              </span>
            )}
            <span className="px-2 py-0.5 bg-primary-light/50 text-accent-light text-xs font-medium rounded">
              {post.category}
            </span>
          </div>

          <Link to={`/post/${post.id}`}>
            <h3 className="text-lg font-semibold text-gray-100 group-hover:text-accent transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
          </Link>

          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {post.content.replace(/<[^>]*>/g, '').slice(0, 150)}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 5).map((tag, index) => (
                <span key={index} className="text-xs text-gray-500 hover:text-accent cursor-pointer transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <Link to={`/profile/${post.author.id}`} className="hover:text-accent transition-colors">
                {post.author.username}
              </Link>
              <span>·</span>
              <span>{timeAgo}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.views}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.replies}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
