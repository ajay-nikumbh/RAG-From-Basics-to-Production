/**
 * App shell.
 *
 * This file is the frame around every page: the sidebar on the left (a top
 * bar on small screens) and the page content on the right, which fills the
 * rest of the window. React Router renders the active page in the Outlet.
 */

// Imports
import { Outlet } from 'react-router'
import Sidebar from './Sidebar'

// Sidebar plus page content
export default function AppShell() {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <Sidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
