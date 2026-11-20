/**
 * Root component.
 *
 * This file defines the pages of the app. Every page renders inside the
 * AppShell (sidebar plus content): Chat at "/", Documents at "/documents"
 * and Analytics at "/analytics". Unknown URLs go back to Chat.
 */

// Imports
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import DocumentsPage from '@/features/documents/DocumentsPage'
import { Navigate, Route, Routes } from 'react-router'
import AppShell from '@/components/layout/AppShell'
import ChatPage from '@/features/chat/ChatPage'

// Page routes
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ChatPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
