import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserModel } from '../models/User.js';
import { createClient } from 'redis';

export class WebSocketService {
  private io: SocketIOServer;
  private redisClient: any;
  private onlineUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: Server) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupRedis();
    this.setupSocketHandlers();
  }

  private async setupRedis() {
    try {
      this.redisClient = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
        password: config.redis.password,
      });
      
      this.redisClient.on('error', (err: any) => {
        console.error('Redis Client Error:', err);
      });
      
      await this.redisClient.connect();
      console.log('✅ Connected to Redis for WebSocket pub/sub');
    } catch (error) {
      console.warn('⚠️ Redis not available, using in-memory storage');
    }
  }

  private setupSocketHandlers() {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
        const user = await UserModel.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).user = user;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      console.log(`🔌 User connected: ${user.username} (${socket.id})`);

      // Store online user mapping
      this.onlineUsers.set(user.id, socket.id);
      
      // Update user online status
      UserModel.updateOnlineStatus(user.id, true);

      // Join user's personal room
      socket.join(`user:${user.id}`);

      // Broadcast user online status
      socket.broadcast.emit('user:online', {
        userId: user.id,
        username: user.username,
      });

      // Handle joining post room for real-time updates
      socket.on('post:join', (postId: string) => {
        socket.join(`post:${postId}`);
        console.log(`User ${user.username} joined post room: ${postId}`);
      });

      socket.on('post:leave', (postId: string) => {
        socket.leave(`post:${postId}`);
      });

      // Handle new reply (real-time)
      socket.on('reply:new', async (data: { postId: string; content: string }) => {
        // Emit to everyone in the post room except sender
        socket.to(`post:${data.postId}`).emit('reply:new', {
          postId: data.postId,
          userId: user.id,
          username: user.username,
          content: data.content,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle typing indicators
      socket.on('typing:start', (postId: string) => {
        socket.to(`post:${postId}`).emit('typing:start', {
          userId: user.id,
          username: user.username,
          postId,
        });
      });

      socket.on('typing:stop', (postId: string) => {
        socket.to(`post:${postId}`).emit('typing:stop', {
          userId: user.id,
          postId,
        });
      });

      // Handle notifications
      socket.on('notification:read', (notificationId: string) => {
        // Emit confirmation to sender
        socket.emit('notification:read:confirm', { notificationId });
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`🔌 User disconnected: ${user.username} (${socket.id})`);
        
        this.onlineUsers.delete(user.id);
        await UserModel.updateOnlineStatus(user.id, false);
        
        socket.broadcast.emit('user:offline', {
          userId: user.id,
          username: user.username,
        });
      });

      // Handle errors
      socket.on('error', (error: any) => {
        console.error(`Socket error for ${user.username}:`, error);
      });
    });
  }

  // Method to emit notification to specific user
  public emitNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  // Method to emit post update to all viewers
  public emitPostUpdate(postId: string, event: string, data: any) {
    this.io.to(`post:${postId}`).emit(event, data);
  }

  // Get online users count
  public getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  // Get all online users
  public getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}
