/**
 * Test set card.
 *
 * Lists the built-in test cases (GET /evals/testset): each question with
 * the file it should be answered from. Hovering a case shows its reference
 * answer. It tells the user exactly what a run will ask before they start
 * one.
 */

// Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/overlay'
import { FileText, Ban } from 'lucide-react'

// Card with every test case
export default function TestsetCard({ cases }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Test set</CardTitle>
          <CardDescription>{cases.length} questions with reference answers</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ul className="divide-y">
          {cases.map((testCase) => (
            <li key={testCase.id} className="py-2.5">
              <Tooltip content={testCase.reference}>
                <div className="cursor-help">
                  <p className="text-[12.5px] leading-snug">{testCase.question}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-subtle-foreground">
                    {testCase.expected_source ? <FileText className="size-3" /> : <Ban className="size-3" />}
                    <span className="truncate">{testCase.expected_source ?? 'Not in the documents: should be refused'}</span>
                  </p>
                </div>
              </Tooltip>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
