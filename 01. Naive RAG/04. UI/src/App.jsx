/**
 * Root component.
 *
 * Temporary page that shows the new design system primitives while the app
 * shell is being built in the next step.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Design system preview
export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-10">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Naive RAG</CardTitle>
            <CardDescription>New design system foundation</CardDescription>
          </div>
          <Badge variant="success">Ready</Badge>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="primary">Primary</Button>
          <Button>Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </CardContent>
      </Card>
    </main>
  )
}
