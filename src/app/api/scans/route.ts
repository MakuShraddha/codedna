import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Try anonymous scans by sessionId
      const sessionId = req.nextUrl.searchParams.get('sessionId')
      if (!sessionId) return NextResponse.json({ scans: [] })

      const { data, error } = await supabase
        .from('anon_scans')
        .select('id, language_a, language_b, similarity, label, is_comparison, created_at, fingerprint_a, fingerprint_b')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return NextResponse.json({ scans: data || [] })
    }

    const { data, error } = await supabase
      .from('scans')
      .select('id, title, language_a, language_b, similarity, label, is_comparison, created_at, fingerprint_a, fingerprint_b')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ scans: data || [] })
  } catch (err) {
    console.error('[scans]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    const { error } = await supabase
      .from('scans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[scans DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
