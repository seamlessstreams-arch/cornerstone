'use client'

import { useState } from 'react'

export default function AriaPage() {
  const [query, setQuery] = useState('Summarise the latest incident and recommend next actions.')
  const [suggestion, setSuggestion] = useState('')
  const [status, setStatus] = useState('')

  const handleGenerate = async () => {
    setStatus('Generating suggestion...')
    const response = await fetch('/api/aria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'Write',
        style: 'Professional Formal',
        content: query,
        recordType: 'aria-note',
        recordId: 'aria-page'
      })
    })

    const data = await response.json()
    if (response.ok && data.suggestion) {
      setSuggestion(data.suggestion)
      setStatus('Suggestion generated')
    } else {
      setStatus(data.error || 'Failed to generate suggestion')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Aria AI Assistant</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={5}
            className="block w-full rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Generate Suggestion
          </button>
          {status && <p className="mt-3 text-slate-600">{status}</p>}
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Suggestion</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">
            {suggestion || 'No suggestion yet. Generate one to see the result.'}
          </p>
        </div>
      </div>
    </div>
  )
}
