import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postApi } from '@utils/api'

const categories = [
  { id: 'general', name: '综合讨论', icon: '💬' },
  { id: 'tech', name: '技术交流', icon: '💻' },
  { id: 'showcase', name: '作品展示', icon: '🎨' },
  { id: 'help', name: '求助问答', icon: '❓' },
]

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await postApi.create({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      navigate(`/post/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">发布新帖</h1>
        <p className="text-gray-400">分享你的想法、问题或作品</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            标题 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-field w-full"
            placeholder="简洁明了的标题能吸引更多关注"
            maxLength={100}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            分类 <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.id })}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  formData.category === cat.id
                    ? 'bg-accent/20 border-accent text-white'
                    : 'bg-dark-bg border-dark-border text-gray-400 hover:border-accent/50'
                }`}
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="text-sm font-medium">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="input-field w-full min-h-[300px] font-mono text-sm"
            placeholder="详细描述你的内容...&#10;&#10;支持 Markdown 格式：&#10;**粗体** *斜体*&#10;`代码`&#10;- 列表项"
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            标签
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="input-field w-full"
            placeholder="用逗号分隔，例如：React, TypeScript, 前端"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">添加相关标签有助于他人发现你的帖子</p>
        </div>

        {/* Tips */}
        <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
          <h4 className="font-medium text-gray-200 mb-2">发帖小贴士</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 使用清晰的标题，避免"求助"、"问题"等模糊词汇</li>
            <li>• 提供足够的背景信息和细节</li>
            <li>• 如果是代码问题，请提供可复现的示例</li>
            <li>• 保持礼貌和尊重，营造良好社区氛围</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-dark-border">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '发布中...' : '发布帖子'}
          </button>
        </div>
      </form>
    </div>
  )
}
