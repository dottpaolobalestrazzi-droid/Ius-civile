
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { query, history = [], profile = 'praticanteAvvocato', show_links = true, force_web_for_cases = true } = req.body || {}
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: 'OPENAI_API_KEY mancante' })
      return
    }

    let sources = []
    if (force_web_for_cases && process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX) {
      try {
        const q = encodeURIComponent(query)
        const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${q}`
        const sres = await fetch(url)
        const sjson = await sres.json()
        if (sjson?.items?.length) {
          sources = sjson.items.slice(0, 5).map(it => ({
            title: it.title, link: it.link, snippet: it.snippet
          }))
        }
      } catch {}
    }

    const sys = `Sei un assistente legale italiano. Profilo utente: ${profile}.
- Materia: diritto civile italiano, processo civile, atti notarili/forensi.
- Cita articoli del codice civile/c.p.c. quando opportuno.
- Se usi informazioni dal web, sii prudente e indica le fonti in fondo (titolo + link).`

    const user = `${query}
${sources.length ? `Fonti trovate:\n${sources.map(s=>`- ${s.title} ${s.link}`).join('\n')}` : ''}`

    const body = {
      model: process.env.IUS_CHAT_MODEL || "gpt-4.1-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ],
      temperature: 0.2
    }

    const oares = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const oaj = await oares.json()
    if (!oares.ok) {
      res.status(500).json({ error: oaj.error || 'Errore OpenAI' })
      return
    }

    const answer = oaj.choices?.[0]?.message?.content || ''

    res.status(200).json({ answer, sources })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Errore server' })
  }
}
