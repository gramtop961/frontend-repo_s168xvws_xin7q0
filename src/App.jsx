import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', tags: '', notes: '' })
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')

  const loadDocs = async (q = '') => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/documents${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      const data = await res.json()
      setDocs(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  const createDoc = async (e) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: form.notes || null
    }
    const res = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const doc = await res.json()
    setForm({ title: '', tags: '', notes: '' })
    setDocs([doc, ...docs])
  }

  const uploadFile = async (id, file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE}/api/documents/${id}/upload`, {
        method: 'POST',
        body: fd
      })
      const updated = await res.json()
      setDocs(docs.map(d => d.id === id ? updated : d))
    } finally {
      setUploading(false)
    }
  }

  const removeDoc = async (id) => {
    await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' })
    setDocs(docs.filter(d => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Scan & Archive</h1>
          <div className="flex gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca..." className="px-3 py-2 rounded border text-sm" />
            <button onClick={()=>loadDocs(query)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Cerca</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <section className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="font-medium text-slate-700 mb-3">Nuovo documento</h2>
          <form onSubmit={createDoc} className="grid sm:grid-cols-3 gap-3">
            <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="Titolo" className="px-3 py-2 rounded border" />
            <input value={form.tags} onChange={e=>setForm({...form, tags: e.target.value})} placeholder="Tag (separati da virgola)" className="px-3 py-2 rounded border" />
            <input value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} placeholder="Note" className="px-3 py-2 rounded border" />
            <button className="sm:col-span-3 px-4 py-2 bg-green-600 text-white rounded">Crea</button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? (
            <div className="text-slate-600">Caricamento...</div>
          ) : docs.length === 0 ? (
            <div className="text-slate-600">Nessun documento. Creane uno e carica un file scansionato.</div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-800">{doc.title}</div>
                    <div className="text-sm text-slate-600">{doc.tags?.map(t => (
                      <span key={t} className="inline-block mr-1 mt-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">#{t}</span>
                    ))}</div>
                    {doc.text_preview && (
                      <pre className="mt-2 p-2 rounded bg-slate-50 text-slate-700 text-xs max-h-32 overflow-auto whitespace-pre-wrap">{doc.text_preview}</pre>
                    )}
                    <div className="text-xs text-slate-500 mt-1">{doc.mime_type || 'Nessun file'} {doc.size ? `• ${(doc.size/1024).toFixed(1)} KB` : ''}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <label className="px-3 py-2 border rounded cursor-pointer text-sm">
                        {uploading ? 'Caricamento...' : 'Carica file'}
                        <input type="file" className="hidden" onChange={e => uploadFile(doc.id, e.target.files[0])} />
                      </label>
                      {doc.mime_type && (
                        <a href={`${API_BASE}/api/documents/${doc.id}/download`} className="px-3 py-2 bg-slate-800 text-white rounded text-sm" target="_blank" rel="noreferrer">Scarica</a>
                      )}
                      <button onClick={()=>removeDoc(doc.id)} className="px-3 py-2 bg-red-600 text-white rounded text-sm">Elimina</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-slate-500">Piattaforma demo per scansione e archiviazione documenti</footer>
    </div>
  )
}

export default App
