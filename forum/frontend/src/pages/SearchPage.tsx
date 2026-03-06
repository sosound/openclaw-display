import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postApi, Post } from '@utils/api'
import PostCard from '@components/PostCard'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery)
    }
  }, [searchQuery])

  const performSearch = async (q: string, pageNum = 1) => {
    if (!q.trim()) return
    
    setLoading(true)
    try {
      const response = await postApi.search(q, pageNum, 20)
      setResults(response.data.posts)
      setTotal(response.data.total)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`)
      performSearch(query, 1)
      setPage(1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索帖子标题、内容或标签..."
              className="input-field w-full pl-12 pr-4 py-3 text-lg"
              autoFocus
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button type="submit" className="btn-primary px-8 py-3">
            搜索
          </button>
        </form>

        {searchQuery && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-400">
              搜索结果：找到 <span className="text-accent font-semibold">{total}</span> 个与 "<span className="text-white">{searchQuery}</span>" 相关的帖子
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-dark-border"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-dark-border rounded w-3/4"></div>
                  <div className="h-3 bg-dark-border rounded w-full"></div>
                  <div className="h-3 bg-dark-border rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => {
                setPage(p => Math.max(1, p - 1))
                performSearch(searchQuery, page - 1)
              }}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-400">
              第 {page} 页 / 共 {Math.ceil(total / 20)} 页
            </span>
            <button
              onClick={() => {
                setPage(p => p + 1)
                performSearch(searchQuery, page + 1)
              }}
              disabled={page >= Math.ceil(total / 20)}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      ) : searchQuery ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">未找到相关结果</h3>
          <p className="text-gray-400 mb-4">尝试使用其他关键词或检查拼写</p>
          <div className="text-sm text-gray-500">
            <p>搜索建议：</p>
            <ul className="mt-2 space-y-1">
              <li>• 检查关键词拼写</li>
              <li>• 尝试更简短的关键词</li>
              <li>• 使用不同的同义词</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">开始搜索</h3>
          <p className="text-gray-400">输入关键词查找感兴趣的帖子</p>
        </div>
      )}

      {/* Search Tips */}
      <div className="card bg-dark-bg">
        <h4 className="font-medium text-gray-200 mb-3">搜索技巧</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <code className="text-accent bg-dark-card px-2 py-1 rounded">关键词</code>
            <p className="mt-1">搜索包含该关键词的帖子</p>
          </div>
          <div>
            <code className="text-accent bg-dark-card px-2 py-1 rounded">#标签</code>
            <p className="mt-1">搜索特定标签的帖子</p>
          </div>
          <div>
            <code className="text-accent bg-dark-card px-2 py-1 rounded">author:用户名</code>
            <p className="mt-1">搜索特定用户的帖子</p>
          </div>
          <div>
            <code className="text-accent bg-dark-card px-2 py-1 rounded">category:分类</code>
            <p className="mt-1">搜索特定分类的帖子</p>
          </div>
        </div>
      </div>
    </div>
  )
}
