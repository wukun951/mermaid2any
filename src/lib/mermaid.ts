import mermaid from 'mermaid'
import type { GraphThemeValue } from '../data/templates'

const baseConfig = {
  fontFamily: '"JetBrains Mono", "Segoe UI", sans-serif',
  flowchart: {
    htmlLabels: false,
    useMaxWidth: false,
  },
  securityLevel: 'strict' as const,
  startOnLoad: false,
  suppressErrorRendering: true,
  themeVariables: {
    fontFamily: '"JetBrains Mono", "Segoe UI", sans-serif',
  },
}

export function extractGraphKind(source: string) {
  const firstMeaningfulLine = source
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstMeaningfulLine) {
    return 'unknown'
  }

  return firstMeaningfulLine.split(/\s+/)[0]
}

export function formatMermaidError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error)
  return rawMessage
    .replace(/\s+/g, ' ')
    .replace(/^Error:\s*/i, '')
    .trim()
}

export async function renderMermaidDiagram(
  source: string,
  theme: GraphThemeValue,
  renderId: string,
) {
  mermaid.initialize({
    ...baseConfig,
    theme,
  })

  return mermaid.render(renderId, source)
}
