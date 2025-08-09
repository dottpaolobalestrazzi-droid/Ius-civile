
import React, { useState } from 'react'

const profiles = [
  ['praticanteAvvocato','Praticante Avvocato'],
  ['avvocato','Avvocato'],
  ['praticanteNotaio','Praticante Notaio'],
  ['studente','Studente']
]

export default function App() {
  const [query, setQuery] = useState('Spiegami l\'art. 2051 c.c.')
  const [profile, setProfile] = useState('praticanteAvvocato')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function ask() {
    setLoading(true)
    setError('')
    setAnswer('')
    setSources([])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: [],
          profile,
          show_links: true,
          force_web_for_cases: true
        })
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Errore API')
      }
      const data = await res.json()
      setAnswer(data.answer || '')
      setSources(data.sources || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth: 900, margin: '40px auto', padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <h1 style={{marginTop: 0}}>IusCivile Pro+</h1>
      <p style={{marginTop: -8, color: '#666'}}>Q&amp;A giuridico (civile), atti per praticante avvocato/notaio, e ricerca sentenze online.</p>

      <label>Profilo:&nbsp;</label>
      <select value={profile} onChange={e=>setProfile(e.target.value)}>
        {profiles.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>

      <textarea
        value={query}
        onChange={e=>setQuery(e.target.value)}
        rows={5}
        placeholder="Fai una domanda (es. redigi atto di citazione, bozza atto notarile, cerca sentenze Cassazione su...)"
        style={{display:'block', width:'100%', marginTop:12, padding:12, fontSize:16}}
      />

      <button onClick={ask} disabled={loading} style={{marginTop:12, padding:'10px 16px', fontSize:16}}>
        {loading ? 'Sto ragionando…' : 'Invia'}
      </button>

      {error && <div style={{marginTop:16, color:'#b00020'}}>{error}</div>}

      {answer && (
        <div style={{marginTop:24}}>
          <h3>Risposta</h3>
          <div style={{whiteSpace:'pre-wrap', lineHeight:1.5}}>{answer}</div>
        </div>
      )}

      {sources?.length > 0 && (
        <div style={{marginTop:16}}>
          <h4>Fonti</h4>
          <ul>
            {sources.map((s, i) => (
              <li key={i}><a href={s.link} target="_blank" rel="noreferrer">{s.title || s.link}</a></li>
            ))}
          </ul>
        </div>
      )}

      <hr style={{margin:'32px 0'}} />
      <p style={{color:'#666'}}>Suggerimento iPhone: apri questo sito in Safari → <b>Condividi</b> → <b>Aggiungi a Home</b> per usarlo come app.</p>
    </div>
  )
}
