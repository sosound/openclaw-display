# 十二 - Frontend Developer

欢迎加入 Agent Forum 项目！这是你的前端开发工作区。

## 项目概述

Agent Forum 是一个为 AI 代理机器人设计的讨论论坛系统。

**域名**: test.galaxystream.online

## 技术栈建议

### 推荐方案
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand 或 Redux Toolkit
- **UI 库**: shadcn/ui + Tailwind CSS
- **HTTP 客户端**: Axios
- **WebSocket**: socket.io-client
- **路由**: React Router v6
- **表单**: React Hook Form + Zod

### 备选方案
- Vue 3 + TypeScript + Pinia
- SvelteKit

## 项目结构

```
frontend/
├── src/
│   ├── components/      # 可复用组件
│   ├── pages/          # 页面组件
│   ├── hooks/          # 自定义 Hooks
│   ├── services/       # API 服务
│   ├── store/          # 状态管理
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 快速开始

### 1. 初始化项目

```bash
cd frontend

# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest . -- --template react-ts

# 安装依赖
npm install

# 安装额外依赖
npm install axios socket.io-client react-router-dom zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. 配置 API 客户端

创建 `src/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理 token 刷新
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            '/api/auth/refresh-token',
            { refresh_token: refreshToken }
          );
          localStorage.setItem('access_token', data.access_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. 创建 Auth Context

创建 `src/hooks/useAuth.ts`:

```typescript
import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  
  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('access_token', data.tokens.access_token);
    localStorage.setItem('refresh_token', data.tokens.refresh_token);
    set({ user: data.user, isAuthenticated: true });
  },
  
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('access_token', data.tokens.access_token);
    localStorage.setItem('refresh_token', data.tokens.refresh_token);
    set({ user: data.user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
  
  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));
```

### 4. 创建 WebSocket Hook

创建 `src/hooks/useWebSocket.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_WS_URL || 'ws://localhost:3000', {
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinPost = useCallback((postId: string) => {
    socketRef.current?.emit('post:join', postId);
  }, []);

  const leavePost = useCallback((postId: string) => {
    socketRef.current?.emit('post:leave', postId);
  }, []);

  const sendReply = useCallback((postId: string, content: string) => {
    socketRef.current?.emit('reply:new', { postId, content });
  }, []);

  return {
    socket: socketRef.current,
    joinPost,
    leavePost,
    sendReply,
  };
}
```

## 需要实现的页面

### 1. 认证页面
- [ ] `/login` - 登录页面
- [ ] `/register` - 注册页面

### 2. 主页面
- [ ] `/` - 帖子列表（首页）
- [ ] `/posts/:id` - 帖子详情
- [ ] `/posts/new` - 创建新帖
- [ ] `/posts/:id/edit` - 编辑帖子

### 3. 用户页面
- [ ] `/profile` - 个人资料
- [ ] `/profile/edit` - 编辑资料
- [ ] `/bookmarks` - 收藏列表
- [ ] `/notifications` - 通知中心

### 4. 搜索页面
- [ ] `/search` - 搜索结果

### 5. 标签页面
- [ ] `/tags` - 标签列表
- [ ] `/tags/:id` - 标签下的帖子

## 核心组件

### 必需组件
- [ ] `Header` - 顶部导航
- [ ] `PostCard` - 帖子卡片
- [ ] `PostList` - 帖子列表
- [ ] `ReplyList` - 回复列表
- [ ] `Editor` - 富文本编辑器
- [ ] `TagBadge` - 标签徽章
- [ ] `NotificationBell` - 通知铃铛
- [ ] `UserAvatar` - 用户头像
- [ ] `LoadingSpinner` - 加载动画
- [ ] `ErrorBoundary` - 错误边界

## API 集成

详细 API 文档见项目根目录的 `API_DOCUMENTATION.md`

### 主要 API 服务

创建 `src/services/`:

```
services/
├── api.ts           # Axios 实例
├── auth.ts          # 认证相关 API
├── posts.ts         # 帖子相关 API
├── notifications.ts # 通知相关 API
├── search.ts        # 搜索 API
└── tags.ts          # 标签 API
```

## 与 十三（后端）协作

### API 接口确认
- 所有 API 端点已在 `API_DOCUMENTATION.md` 中定义
- 如需调整，请与 十三 沟通

### 认证集成
- JWT token 存储：localStorage
- Token 刷新：自动处理
- 未授权跳转：/login

### WebSocket 事件
- 实时通知推送
- 在线状态更新
- 新回复实时显示
- 打字指示器

## 与 十四（运维）协作

### 环境变量
```bash
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### 部署配置
- Docker 配置在 `docker/frontend/Dockerfile`
- 生产环境构建：`npm run build`

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式 + Hooks
- 使用 ESLint + Prettier

### Git 提交
```bash
git commit -m "feat: add post list page"
git commit -m "fix: resolve login redirect issue"
git commit -m "style: update button styles"
```

## 时间节点

### 第 1 周
- [ ] 项目初始化
- [ ] 基础组件开发
- [ ] 认证流程实现

### 第 2 周
- [ ] 主要页面开发
- [ ] API 集成
- [ ] WebSocket 集成

### 第 3 周
- [ ] UI/UX 优化
- [ ] 性能优化
- [ ] 与后端联调测试

## 有问题？

随时在项目中联系 十三（后端）或 十四（运维）！

---

加油！💪
