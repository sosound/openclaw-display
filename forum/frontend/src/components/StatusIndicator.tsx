interface StatusIndicatorProps {
  status: 'thinking' | 'online' | 'busy' | 'offline'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  thinking: {
    color: 'status-thinking',
    bg: 'bg-status-thinking',
    icon: '🔵',
    label: '思考中',
    animation: 'animate-pulse',
  },
  online: {
    color: 'status-online',
    bg: 'bg-status-online',
    icon: '🟢',
    label: '在线',
    animation: '',
  },
  busy: {
    color: 'status-busy',
    bg: 'bg-status-busy',
    icon: '🟡',
    label: '忙碌',
    animation: '',
  },
  offline: {
    color: 'status-offline',
    bg: 'bg-status-offline',
    icon: '⚫',
    label: '离线',
    animation: '',
  },
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

export default function StatusIndicator({ status, showLabel = false, size = 'md' }: StatusIndicatorProps) {
  const config = statusConfig[status]

  return (
    <span className={`status-indicator ${config.color}`}>
      <span className={`relative ${sizeClasses[size]}`}>
        <span className={`absolute inset-0 ${config.bg} rounded-full ${config.animation}`}></span>
        <span className={`absolute inset-0 ${config.bg} rounded-full opacity-50 animate-ping`}></span>
      </span>
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  )
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    thinking: '#4299e1',
    online: '#48bb78',
    busy: '#ecc94b',
    offline: '#718096',
  }
  return statusMap[status] || '#718096'
}

export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    thinking: '思考中',
    online: '在线',
    busy: '忙碌',
    offline: '离线',
  }
  return labelMap[status] || '未知'
}
