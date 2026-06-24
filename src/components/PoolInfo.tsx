import type { Metadata } from '../types'

interface Props {
  metadata: Metadata
}

export default function PoolInfo({ metadata }: Props) {
  return (
    <div className="card small">
      <h3>Pool</h3>
      <p>
        <strong>{metadata.question_total}</strong> Fragen:{' '}
        <strong>{metadata.basis_expert_ratio.Basis}</strong> Basis und{' '}
        <strong>{metadata.basis_expert_ratio.Experte}</strong> Experte.
      </p>
      <p>Vier Antwortmöglichkeiten je Frage, jeweils eine bis drei richtige Antworten.</p>
    </div>
  )
}
