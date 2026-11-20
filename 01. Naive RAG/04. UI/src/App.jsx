/**
 * Root component.
 *
 * This file defines the pages of the app. Every page renders inside the
 * AppShell (sidebar plus content): Chat at "/", Documents at "/documents"
 * Analytics at "/analytics" and Evals at "/evals". Unknown URLs go back to Chat. The
 * ChatProvider keeps the conversation while moving between pages.
 */

// Imports
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import DocumentsPage from '@/features/documents/DocumentsPage'
import { ChatProvider } from '@/features/chat/ChatContext'
import { Navigate, Route, Routes } from 'react-router'
import AppShell from '@/components/layout/AppShell'
import EvalsPage from '@/features/evals/EvalsPage'
import ChatPage from '@/features/chat/ChatPage'

// Page routes
export default function App() {
  return (
    <ChatProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ChatPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="evals" element={<EvalsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ChatProvider>
  )
}
