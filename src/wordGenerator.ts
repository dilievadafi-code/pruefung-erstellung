import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, BorderStyle, AlignmentType, PageBreak } from 'docx'
import { saveAs } from 'file-saver'
import { Packer } from 'docx'
import type { GeneratedExam } from './types'

const LETTERS = ['A', 'B', 'C', 'D']

export async function generateWordDocument(exam: GeneratedExam, includeKey: boolean): Promise<void> {
  const children: (Paragraph | Table)[] = []

  // Questions
  for (const q of exam.questions) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${q.nr}. ${q.question}`, bold: true, size: 22 })],
        spacing: { before: 100, after: 50 },
      })
    )

    for (const letter of LETTERS) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${letter.toLowerCase()}) `, bold: true, size: 22 }),
            new TextRun({ text: q.answers[letter], size: 22 }),
          ],
          indent: { left: 360 },
          spacing: { after: 0 },
        })
      )
    }
  }

  // Answer key
  if (includeKey && exam.answer_key && exam.answer_key.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }))

    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Lösungsschlüssel', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    )

    const tableRows = [
      new TableRow({
        children: ['Nr.', 'Lösung', 'ID', 'Thema', 'Niveau'].map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: header, bold: true, size: 18 })],
                }),
              ],
              shading: { fill: 'D9EAF7' },
            })
        ),
      }),
    ]

    for (const item of exam.answer_key) {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(item.nr), size: 16 })] })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.solution.map((s) => s + ')').join(', '), size: 16 })],
                }),
              ],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item.id, size: 16 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(item.topic_nr), size: 16 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: item.level, size: 16 })] })],
            }),
          ],
        })
      )
    }

    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: BorderStyle.SINGLE, size: 1 },
        },
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 964,
              bottom: 907,
              left: 1077,
              right: 1077,
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${exam.title.replace(/\s+/g, '_')}.docx`)
}

export async function generateWordForPool(questions: any[], title: string): Promise<void> {
  const children: (Paragraph | Table)[] = []

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 34,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${q.question}`, bold: true, size: 22 })],
        spacing: { before: 100, after: 50 },
      })
    )

    for (const letter of LETTERS) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${letter.toLowerCase()}) `, bold: true, size: 22 }),
            new TextRun({ text: q.answers[letter], size: 22 }),
          ],
          indent: { left: 360 },
          spacing: { after: 0 },
        })
      )
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Lösung: ${q.solution.join(', ')}`, size: 20, color: '0066CC' }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  const doc = new Document({
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, 'Fragenpool_ITGS_Praktiker_200.docx')
}
