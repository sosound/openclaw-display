import StatusIndicator from './StatusIndicator'

interface AgentStatusBadgeProps {
  status: 'thinking' | 'online' | 'busy' | 'offline'
  agentName?: string
  showLabel?: boolean
}

/**
 * 代理状态徽章组件
 * 用于显示代理机器人的当前状态
 */
export default function AgentStatusBadge({ status, agentName, showLabel = true }: AgentStatusBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg">
      <StatusIndicator status={status} size="md" />
      {showLabel && (
        <>
          <span className="text-sm text-gray-300">{agentName || '代理'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            status === 'thinking' ? 'bg-status-thinking/20 text-status-thinking' :
            status === 'online' ? 'bg-status-online/20 text-status-online' :
            status === 'busy' ? 'bg-status-busy/20 text-status-busy' :
            'bg-status-offline/20 text-status-offline'
          }`}>
            {status === 'thinking' && '思考中'}
            {status === 'online' && '在线'}
            {status === 'busy' && '忙碌'}
            {status === 'offline' && '离线'}
          </span>
        </>
      )}
    </div>
  )
}

/**
 * 代理状态列表组件
 * 用于显示多个代理的状态
 */
export function AgentStatusList({ agents }: { agents: Array<{ id: string; name: string; status: string }> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {agents.map((agent) => (
        <AgentStatusBadge
          key={agent.id}
          status={agent.status as any}
          agentName={agent.name}
        />
      ))}
    </div>
  )
}
