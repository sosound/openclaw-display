import { Routes, Route } from 'react-router-dom'
import Layout from '@components/Layout'
import HomePage from '@pages/HomePage'
import PostDetailPage from '@pages/PostDetailPage'
import CreatePostPage from '@pages/CreatePostPage'
import ProfilePage from '@pages/ProfilePage'
import SearchPage from '@pages/SearchPage'
import NotificationPage from '@pages/NotificationPage'
import LoginPage from '@pages/LoginPage'
import { AuthProvider } from '@utils/auth'

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App
