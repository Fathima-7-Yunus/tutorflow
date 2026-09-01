'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  sessionId: string
  initialNotes: string
  editable: boolean
}

export default function SessionNotesEditor({ sessionId, initialNotes, editable }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(initialNotes)

  const save = useCallback(async (text: string) => {
    if (text === lastSavedRef.current) return
    setSaveStatus('saving')
    lastSavedRef.current = text
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: text }),
      })
      if (res.ok) {
        setSaveStatus('saved')
      }
    } catch {
      setSaveStatus(null)
    }
  }, [sessionId])

  const debouncedSave = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(text), 1500)
  }, [save])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (lastSavedRef.current !== notes) {
        const text = notes
        navigator.sendBeacon?.(
          `/api/sessions/${sessionId}`,
          new Blob([JSON.stringify({ notes: text })], { type: 'application/json' }),
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastSavedRef.current !== notes) {
        navigator.sendBeacon?.(
          `/api/sessions/${sessionId}`,
          new Blob([JSON.stringify({ notes: notes })], { type: 'application/json' }),
        )
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [notes, sessionId])

  function handleChange(value: string) {
    setNotes(value)
    setSaveStatus(null)
    debouncedSave(value)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Session notes</label>
        {saveStatus === 'saving' && <span className="text-xs text-amber-500">Saving…</span>}
        {saveStatus === 'saved' && <span className="text-xs text-emerald-500">Saved</span>}
      </div>
      {editable ? (
        <textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Type your session notes here. They will be saved automatically."
        />
      ) : (
        <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {notes || 'No notes taken.'}
        </div>
      )}
    </div>
  )
}