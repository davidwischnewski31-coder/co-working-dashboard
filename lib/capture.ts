export type CaptureIntent = 'task' | 'idea' | 'decision' | 'reading' | 'inbox'

export type ParsedCapture = {
  intent: CaptureIntent
  title: string
  body?: string
  url?: string
}

export function parseCaptureInput(input: string): ParsedCapture | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (/^task:/i.test(trimmed)) {
    const title = trimmed.replace(/^task:/i, '').trim()
    return { intent: 'task', title: title || 'New task' }
  }

  if (/^idea:/i.test(trimmed)) {
    const title = trimmed.replace(/^idea:/i, '').trim()
    return { intent: 'idea', title: title || 'New idea' }
  }

  if (/^decision:/i.test(trimmed)) {
    const title = trimmed.replace(/^decision:/i, '').trim()
    return { intent: 'decision', title: title || 'Decision needed' }
  }

  if (/^inbox:/i.test(trimmed)) {
    const title = trimmed.replace(/^inbox:/i, '').trim()
    return { intent: 'inbox', title: title || 'Inbox item' }
  }

  const directUrlMatch = /(https?:\/\/\S+)/i.exec(trimmed)
  if (/^read:/i.test(trimmed) || directUrlMatch) {
    const withoutPrefix = trimmed.replace(/^read:/i, '').trim()
    const urlMatch = /(https?:\/\/\S+)/i.exec(withoutPrefix || trimmed)
    const url = urlMatch?.[1]
    const title = (withoutPrefix || trimmed).replace(url ?? '', '').trim()

    return {
      intent: 'reading',
      title: title || 'Captured article',
      url,
      body: url ? undefined : 'No URL found. Stored in Inbox so you can complete it later.',
    }
  }

  return { intent: 'inbox', title: trimmed }
}

export function intentLabel(parsed: ParsedCapture): string {
  if (parsed.intent === 'task') return `Task backlog item: ${parsed.title}`
  if (parsed.intent === 'idea') return `Idea pipeline item: ${parsed.title}`
  if (parsed.intent === 'decision') return `Decision needed inbox item: ${parsed.title}`
  if (parsed.intent === 'reading') {
    return parsed.url
      ? `Reading queue article: ${parsed.title}`
      : `Inbox follow-up for reading candidate: ${parsed.title}`
  }
  return `Inbox suggestion: ${parsed.title}`
}
