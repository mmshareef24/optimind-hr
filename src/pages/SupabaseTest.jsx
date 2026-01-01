import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient'

export default function SupabaseTest() {
  const [status, setStatus] = useState('init')
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])

  useEffect(() => {
    async function run() {
      if (!isSupabaseConfigured) {
        setStatus('not_configured')
        return
      }

      try {
        setStatus('loading')
        // Replace 'test_table' with your table name
        const { data, error } = await supabase
          .from('test_table')
          .select('*')
          .limit(5)

        if (error) {
          setError(error.message)
          setStatus('error')
        } else {
          setRows(data || [])
          setStatus('ok')
        }
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    }
    run()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Supabase Connectivity Test</h1>
      {status === 'not_configured' && (
        <div className="text-amber-700">Supabase env vars missing. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.</div>
      )}
      {status === 'loading' && (
        <div className="text-slate-600">Loading from `test_table`…</div>
      )}
      {status === 'error' && (
        <div className="text-red-700">Error: {error}</div>
      )}
      {status === 'ok' && (
        <div>
          <div className="text-slate-700 mb-2">Fetched {rows.length} rows:</div>
          <pre className="bg-slate-100 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(rows, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}