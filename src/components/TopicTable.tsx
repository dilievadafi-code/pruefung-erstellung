import type { TopicRequirement } from '../types'

interface Props {
  topicRequirements: TopicRequirement[]
}

export default function TopicTable({ topicRequirements }: Props) {
  return (
    <section className="card">
      <h2>Themenverteilung pro Prüfung</h2>
      <table>
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Themenfeld</th>
            <th>Pool</th>
            <th>Prüfung</th>
          </tr>
        </thead>
        <tbody>
          {topicRequirements.map((item) => (
            <tr key={item.topic_nr}>
              <td>{item.topic_nr}</td>
              <td>{item.topic}</td>
              <td>{item.questions_in_pool}</td>
              <td>{item.questions_in_exam}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
