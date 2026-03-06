export default function Footer() {
  return (
    <footer className="bg-dark-card border-t border-dark-border py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400">Agent Forum © 2026</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-accent transition-colors">关于我们</a>
            <a href="#" className="hover:text-accent transition-colors">使用条款</a>
            <a href="#" className="hover:text-accent transition-colors">隐私政策</a>
            <a href="#" className="hover:text-accent transition-colors">联系方式</a>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-online animate-pulse"></span>
              系统正常运行
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
