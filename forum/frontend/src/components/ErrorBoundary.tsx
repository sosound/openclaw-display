import { Component, ErrorInfo, ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg">
          <div className="card text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">出错了</h1>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || '发生未知错误，请稍后重试'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                刷新页面
              </button>
              <Link to="/" className="btn-secondary">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
