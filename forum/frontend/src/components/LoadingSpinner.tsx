interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} border-2 border-accent/30 border-t-accent rounded-full animate-spin`}></div>
      {text && <p className="text-gray-400 text-sm mt-3">{text}</p>}
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  )
}
