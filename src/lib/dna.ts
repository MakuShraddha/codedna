export interface CodeFeatures {
  vector: number[]
  language: string
  lines: number
  complexity: string
  fingerprint: string
}

export interface CompareResult {
  score: number
  label: string
  breakdown: { feature: string; a: number; b: number; diff: number }[]
}

export const FEATURE_LABELS = [
  'Function Density',
  'Loop Complexity',
  'Nesting Depth',
  'Comment Ratio',
  'Operator Frequency',
  'Naming Style',
  'String Usage',
  'Cyclomatic Complexity',
  'Line Length Profile',
  'Numeric Density',
]

export function extractFeatures(code: string): CodeFeatures | null {
  if (!code || code.trim().length === 0) return null

  const lines = code.split('\n')
  const nonEmpty = lines.filter((l) => l.trim().length > 0)

  // F1: function density
  const fnMatches = (
    code.match(
      /\b(function|def |const\s+\w+\s*=\s*(async\s*)?\(|=>\s*{|\bfunc\b|\bfn\s+\w)/g
    ) || []
  ).length
  const fnDensity = Math.min(fnMatches / Math.max(nonEmpty.length, 1), 1)

  // F2: loop density
  const loops = (
    code.match(/\b(for|while|forEach|\.map\(|\.filter\(|\.reduce\(|loop)\b/g) || []
  ).length
  const loopDensity = Math.min((loops / Math.max(nonEmpty.length, 1)) * 5, 1)

  // F3: nesting depth via indentation
  const indents = nonEmpty.map((l) => (l.match(/^(\s*)/)?.[1].length ?? 0))
  const maxIndent = Math.min(Math.max(...indents, 0) / 32, 1)

  // F4: comment ratio
  const comments = lines.filter((l) =>
    l.trim().match(/^(#|\/\/|\/\*|\*|<!--)/)
  ).length
  const commentRatio = Math.min(comments / Math.max(lines.length, 1), 1)

  // F5: operator frequency
  const operators = (code.match(/[+\-*/%&|^~<>=!]+/g) || []).length
  const opDensity = Math.min(
    (operators / Math.max(code.length, 1)) * 20,
    1
  )

  // F6: naming style (camel vs snake)
  const varNames = code.match(/\b[a-z_][a-z0-9_]*\b/gi) || []
  const snakeCount = varNames.filter((v) => v.includes('_')).length
  const camelCount = varNames.filter((v) => /[a-z][A-Z]/.test(v)).length
  const namingStyle = Math.min(
    (camelCount - snakeCount + varNames.length) /
      Math.max(varNames.length * 2, 1),
    1
  )

  // F7: string usage
  const strings = (code.match(/(["'`])(.*?)\1/g) || []).length
  const stringDensity = Math.min(strings / Math.max(nonEmpty.length, 1), 1)

  // F8: keyword complexity
  const keywords = [
    'if','else','return','class','import','export','try','catch','async','await',
  ]
  const kwCount = keywords.reduce(
    (acc, kw) =>
      acc + (code.match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length,
    0
  )
  const complexity = Math.min(kwCount / Math.max(nonEmpty.length, 1), 1)

  // F9: line length profile
  const avgLen =
    nonEmpty.reduce((s, l) => s + l.length, 0) / Math.max(nonEmpty.length, 1)
  const lineLengthProfile = Math.min(avgLen / 120, 1)

  // F10: numeric literal density
  const nums = (code.match(/\b\d+(\.\d+)?\b/g) || []).length
  const numDensity = Math.min((nums / Math.max(code.length, 1)) * 30, 1)

  const vector = [
    fnDensity, loopDensity, maxIndent, commentRatio, opDensity,
    namingStyle, stringDensity, complexity, lineLengthProfile, numDensity,
  ]

  // Language detection
  let language = 'Unknown'
  if (code.match(/\bdef \w+|import \w+\n|print\(|__name__|\.py\b/))
    language = 'Python'
  else if (
    code.match(/\bconst\b|\blet\b|\bfunction\b|=>\s*{|console\.log/)
  )
    language = 'JavaScript / TypeScript'
  else if (code.match(/\bfun \w+|\bval \b|\bvar \b.*:/)) language = 'Kotlin'
  else if (code.match(/\bpublic\s+class\b|\bSystem\.out\b/)) language = 'Java'
  else if (code.match(/\bfunc \w+.*\{|\bvar \w+\s*:/)) language = 'Swift'
  else if (code.match(/\bfn \w+|\blet mut\b/)) language = 'Rust'
  else if (code.match(/#include|std::|cout\b/)) language = 'C++'
  else if (code.match(/\bpackage main\b|\bfmt\.Print/)) language = 'Go'

  // Complexity label
  const score = vector.reduce((a, b) => a + b, 0) / vector.length
  const complexityLabel =
    score > 0.6 ? 'High' : score > 0.35 ? 'Medium' : 'Low'

  // Fingerprint: hex-like string from vector
  const fingerprint = vector
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')

  return { vector, language, lines: nonEmpty.length, complexity: complexityLabel, fingerprint }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  if (magA === 0 || magB === 0) return 0
  return Math.max(0, Math.min(1, dot / (magA * magB)))
}

export function compareFeatures(a: CodeFeatures, b: CodeFeatures): CompareResult {
  const score = Math.round(cosineSimilarity(a.vector, b.vector) * 100)

  const label =
    score >= 90 ? 'Near Duplicate' :
    score >= 75 ? 'Highly Similar' :
    score >= 55 ? 'Similar Style' :
    score >= 35 ? 'Partial Match' :
    score >= 15 ? 'Different Approach' :
    'Totally Different'

  const breakdown = FEATURE_LABELS.map((feature, i) => ({
    feature,
    a: a.vector[i] ?? 0,
    b: b.vector[i] ?? 0,
    diff: Math.abs((a.vector[i] ?? 0) - (b.vector[i] ?? 0)),
  }))

  return { score, label, breakdown }
}
