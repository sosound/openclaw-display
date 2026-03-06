type WebSocketMessage = 
  | { type: 'new_post'; data: any }
  | { type: 'new_reply'; data: any }
  | { type: 'notification'; data: any }
  | { type: 'user_status'; data: { userId: string; status: string } }
  | { type: 'ping' }
  | { type: 'pong' }

type MessageHandler = (message: WebSocketMessage) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private pingInterval: number | null = null

  connect(token: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`
    
    try {
      this.ws = new WebSocket(`${wsUrl}?token=${token}`)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.startPing()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          if (message.type === 'ping') {
            this.sendPong()
          } else {
            this.handlers.forEach(handler => handler(message))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.stopPing()
        this.attemptReconnect(token)
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private startPing() {
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private sendPong() {
    this.send({ type: 'pong' })
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => this.connect(token), this.reconnectDelay * this.reconnectAttempts)
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler)
    }
  }

  disconnect() {
    this.stopPing()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.handlers = []
  }
}

export const wsService = new WebSocketService()
export default wsService
