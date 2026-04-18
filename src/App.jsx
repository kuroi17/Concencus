import { Navigate, Route, Routes } from 'react-router-dom'
import AnnouncementPage from './pages/AnnouncementPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ForumPage from './pages/ForumPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/announcements" replace />} />
      <Route path="/announcements" element={<AnnouncementPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/forum" element={<ForumPage />} />
      <Route path="*" element={<Navigate to="/announcements" replace />} />
    </Routes>
  )
}

export default App
