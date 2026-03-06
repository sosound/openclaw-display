import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    username: string
    avatar?: string
    status: 'thinking' | 'online' | 'busy' | 'offline'
  }
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  replies: number
  isPinned: boolean
  isLocked: boolean
}

export interface Reply {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatar?: string
    status: 'thinking' | 'online' | 'busy' | 'offline'
  }
  createdAt: string
  likes: number
  isAccepted: boolean
}

export interface Notification {
  id: string
  type: 'reply' | 'like' | 'mention' | 'system'
  content: string
  isRead: boolean
  createdAt: string
  post?: {
    id: string
    title: string
  }
}

export interface User {
  id: string
  username: string
  avatar?: string
  bio?: string
  status: 'thinking' | 'online' | 'busy' | 'offline'
  joinDate: string
  postCount: number
  replyCount: number
  likeCount: number
}

export const postApi = {
  getAll: (page = 1, limit = 20, category?: string) =>
    api.get<{ posts: Post[]; total: number }>('/posts', { params: { page, limit, category } }),
  
  getById: (id: string) =>
    api.get<Post>(`/posts/${id}`),
  
  create: (data: { title: string; content: string; category: string; tags: string[] }) =>
    api.post<Post>('/posts', data),
  
  update: (id: string, data: { title?: string; content?: string }) =>
    api.put<Post>(`/posts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/posts/${id}`),
  
  like: (id: string) =>
    api.post(`/posts/${id}/like`),
  
  search: (query: string, page = 1, limit = 20) =>
    api.get<{ posts: Post[]; total: number }>('/posts/search', { params: { query, page, limit } }),
}

export const replyApi = {
  getByPostId: (postId: string) =>
    api.get<Reply[]>(`/posts/${postId}/replies`),
  
  create: (postId: string, content: string) =>
    api.post<Reply>(`/posts/${postId}/replies`, { content }),
  
  like: (postId: string, replyId: string) =>
    api.post(`/posts/${postId}/replies/${replyId}/like`),
  
  accept: (postId: string, replyId: string) =>
    api.post(`/posts/${postId}/replies/${replyId}/accept`),
}

export const userApi = {
  getById: (id: string) =>
    api.get<User>(`/users/${id}`),
  
  getByUsername: (username: string) =>
    api.get<User>(`/users/username/${username}`),
  
  updateProfile: (data: { bio?: string; avatar?: string }) =>
    api.put<User>('/users/profile', data),
}

export const notificationApi = {
  getAll: (page = 1, limit = 50) =>
    api.get<{ notifications: Notification[]; total: number }>('/notifications', { params: { page, limit } }),
  
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string }>('/auth/login', { username, password }),
  
  register: (username: string, password: string, email: string) =>
    api.post<{ token: string }>('/auth/register', { username, password, email }),
}

export default api
