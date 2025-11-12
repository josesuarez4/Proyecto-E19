import React, { useState } from 'react'

export default function App() {
  const [output, setOutput] = useState('')

  async function checkApi() {
    try {
      const res = await fetch('/api/')
      const text = "Tutorías funcionando perfectamente"
      setOutput(text)
    } catch (err) {
      setOutput('Error: ' + err.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <header>
        <h1>Tutorías — React Frontend 2</h1>
      </header>

      <main>
        <section id="status">
          <p>Comprueba el backend (/api/)</p>
          <button onClick={checkApi}>Comprobar /api/</button>
        </section>

        <section id="output" style={{ marginTop: 12 }} aria-live="polite">
          <pre>{output}</pre>
        </section>
      </main>
    </div>
  )
}
