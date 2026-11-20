/**
 * Evidence panel.
 *
 * This file is the content of the evidence panel. For the selected turn it
 * shows the question and every retrieved chunk as a source card, best score
 * first. It works out which source numbers the answer cites, so cited chunks
 * are highlighted and the others are marked "not cited". Before any question,
 * while waiting, after an error or when nothing was found, it shows a matching
 * empty state.
 */

// Imports
import PanelHeader from '../../components/PanelHeader.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { citedNumbers } from '../chat/citations.js'
import styles from './EvidencePanel.module.css'
import { plural } from '../../utils/format.js'
import SourceCard from './SourceCard.jsx'

// Evidence for the selected turn
export default function EvidencePanel({ turn, focusedNumber }) {

  // Nothing selected yet
  if (!turn) {
    return (
      <section>
        <PanelHeader title="Evidence" />
        <EmptyState title="Nothing to verify yet">
          The chunks an answer was built from will be shown here, highlighted.
        </EmptyState>
      </section>
    )
  }

  // Waiting for the answer
  if (turn.status === 'pending') {
    return (
      <section>
        <PanelHeader title="Evidence" />
        <p className={styles.note}>Retrieving chunks...</p>
      </section>
    )
  }

  // The question failed, or nothing was retrieved
  if (turn.status === 'error' || turn.sources.length === 0) {
    return (
      <section>
        <PanelHeader title="Evidence" />
        <EmptyState title="No evidence">
          {turn.status === 'error' ? 'The question failed, so no chunks were retrieved.' : 'No chunks were retrieved for this question.'}
        </EmptyState>
      </section>
    )
  }

  // Numbers the answer cites, for highlighting
  const cited = citedNumbers(turn.answer)

  return (
    <section>
      <PanelHeader title="Evidence" meta={`${cited.size} of ${plural(turn.sources.length, 'source')} cited`} />
      <p className={styles.question}>{turn.question}</p>
      <ul className={styles.list}>
        {turn.sources.map((source) => (
          <SourceCard
            key={source.number}
            source={source}
            cited={cited.has(source.number)}
            focused={source.number === focusedNumber}
          />
        ))}
      </ul>
    </section>
  )
}
