import { NextRequest, NextResponse } from 'next/server'
import { extractFeatures } from '@/lib/dna'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { code, title, sessionId } = await req.json()

    if (!code?.trim()) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const features = extractFeatures(code)
    if (!features) {
      return NextResponse.json({ error: 'Could not parse code' }, { status: 422 })
    }

    // Save to Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let scanId: string | null = null

    if (user) {
      // Authenticated scan
      const { data, error } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          title: title || `${features.language} · ${features.lines} lines`,
          code_a: code,
          language_a: features.language,
          features_a: { vector: features.vector, lines: features.lines, complexity: features.complexity },
          fingerprint_a: features.fingerprint,
          is_comparison: false,
        })
        .select('id')
        .single()

      if (!error && data) scanId = data.id
    } else if (sessionId) {
      // Anonymous scan
      const { data, error } = await supabase
        .from('anon_scans')
        .insert({
          session_id: sessionId,
          code_a: code,
          language_a: features.language,
          features_a: { vector: features.vector, lines: features.lines, complexity: features.complexity },
          fingerprint_a: features.fingerprint,
          is_comparison: false,
        })
        .select('id')
        .single()

      if (!error && data) scanId = data.id
    }

    return NextResponse.json({ features, scanId })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
