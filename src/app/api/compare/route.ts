import { NextRequest, NextResponse } from 'next/server'
import { extractFeatures, compareFeatures } from '@/lib/dna'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { codeA, codeB, title, sessionId } = await req.json()

    if (!codeA?.trim() || !codeB?.trim()) {
      return NextResponse.json({ error: 'Both code snippets required' }, { status: 400 })
    }

    const featA = extractFeatures(codeA)
    const featB = extractFeatures(codeB)

    if (!featA || !featB) {
      return NextResponse.json({ error: 'Could not parse one or both snippets' }, { status: 422 })
    }

    const result = compareFeatures(featA, featB)

    // Save to Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let scanId: string | null = null

    const scanPayload = {
      title: title || `${featA.language} vs ${featB.language} — ${result.score}% match`,
      code_a: codeA,
      language_a: featA.language,
      features_a: { vector: featA.vector, lines: featA.lines, complexity: featA.complexity },
      fingerprint_a: featA.fingerprint,
      code_b: codeB,
      language_b: featB.language,
      features_b: { vector: featB.vector, lines: featB.lines, complexity: featB.complexity },
      fingerprint_b: featB.fingerprint,
      similarity: result.score,
      label: result.label,
      breakdown: result.breakdown,
      is_comparison: true,
    }

    if (user) {
      const { data, error } = await supabase
        .from('scans')
        .insert({ ...scanPayload, user_id: user.id })
        .select('id')
        .single()
      if (!error && data) scanId = data.id
    } else if (sessionId) {
      const { data, error } = await supabase
        .from('anon_scans')
        .insert({ ...scanPayload, session_id: sessionId })
        .select('id')
        .single()
      if (!error && data) scanId = data.id
    }

    return NextResponse.json({ featA, featB, result, scanId })
  } catch (err) {
    console.error('[compare]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
