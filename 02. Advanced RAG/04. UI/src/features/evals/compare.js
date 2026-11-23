/**
 * Preset comparison helpers.
 *
 * The Evals page compares the ablation presets A to E (API doc 10). This
 * file picks the newest finished run of each preset, lists the measures
 * shown in the comparison table, and computes the change of every measure
 * against the baseline preset A, so the effect of each added stage can be
 * read in one table.
 */

// Presets in ablation order
export const PRESET_ORDER = ['A', 'B', 'C', 'D', 'E']

// Short label of each preset: what it adds to the one before
export const PRESET_SHORT = {
  A: 'Naive baseline',
  B: '+ rewrite',
  C: '+ rerank, keep 4',
  D: '+ threshold',
  E: '+ compression',
}

// Label of a run's preset, or "Current settings" for a run without preset
export function presetLabel(preset) {
  return preset ? PRESET_SHORT[preset] ?? preset : 'Current settings'
}

// Measures shown per preset: summary key, label, and whether lower is better
export const MEASURES = [
  { key: 'overall', label: 'Overall' },
  { key: 'context_precision', label: 'Context precision' },
  { key: 'correctness', label: 'Correctness' },
  { key: 'faithfulness', label: 'Faithfulness' },
  { key: 'retrieval_hit_rate', label: 'Hit rate' },
  { key: 'avg_latency_ms', label: 'Avg answer time', lowerIsBetter: true },
]

// Newest finished run of every preset that has one, in ablation order
export function latestByPreset(runs = []) {

  // Runs come newest first, so the first match of a preset is its newest run
  const latest = {}
  for (const run of runs) {
    if (run.preset && run.status === 'done' && !latest[run.preset]) {
      latest[run.preset] = run
    }
  }

  // Ablation order, skipping presets that were never run
  return PRESET_ORDER.filter((preset) => latest[preset]).map((preset) => latest[preset])
}

// Change of one measure against the baseline: value minus baseline, null when either is missing
export function deltaFrom(baseline, run, key) {
  const base = baseline?.summary?.[key]
  const value = run?.summary?.[key]
  if (base === null || base === undefined || value === null || value === undefined) {
    return null
  }
  return value - base
}

// Whether a change is an improvement, taking "lower is better" measures into account
export function isBetter(delta, lowerIsBetter = false) {
  if (delta === null || delta === 0) {
    return null
  }
  return lowerIsBetter ? delta < 0 : delta > 0
}
