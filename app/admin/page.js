"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function AdminPanel() {
  const [csvText, setCsvText] = useState('')
  const [listPlayerIds, setListPlayerIds] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. UPLOAD CSV HISTORY
  const handleUpload = async () => {
    if (!csvText) return alert('Isi dulu datanya, Bos!')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Sesi abis, login lagi dah!')

    setLoading(true)
    try {
      const rows = csvText.split('\n').filter(row => row.trim() !== '')
      const dataToInsert = rows.slice(1).map(row => {
        const col = row.split(',')
        return {
          "Date ": col[0]?.replace(/"/g, '').trim(),
          "Info": col[1]?.replace(/"/g, '').trim(),
          "TO": col[2]?.replace(/"/g, '').trim(),
          "BY": col[3]?.replace(/"/g, '').trim(),
          "Coin": parseFloat(col[4]) || 0,
          "Last Coin": parseFloat(col[5]) || 0,
          "user_id": user.id
        }
      }).filter(item => item["TO"])

      const { error } = await supabase.from('coin_history').upsert(dataToInsert)
      if (error) throw error

      alert('Upload Berhasil! Dashboard otomatis update sekarang.')
      setCsvText('')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. REGISTER MULTIPLE PLAYER IDS
  const addMultiplePlayers = async () => {
    if (!listPlayerIds) return alert('Isi dulu list ID-nya!')
    const { data: { user } } = await supabase.auth.getUser()
    setLoading(true)
    try {
      const rawIds = listPlayerIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id !== '')
      const uniqueIds = [...new Set(rawIds)]
      const dataToInsert = uniqueIds.map(id => ({ player_id: id, user_id: user.id }))
      
      const { error } = await supabase.from('monitored_players').upsert(dataToInsert)
      if (error) throw error

      alert(`Mantap! ${uniqueIds.length} ID berhasil didaftarkan ke Watchlist.`)
      setListPlayerIds('')
    } catch (err) {
      alert('Gagal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. DELETE HISTORY COIN ONLY
  const deleteHistory = async () => {
    const yakin = confirm("Yakin mau hapus SEMUA HISTORY COIN lu, Bos Riku? ID Watchlist tetep aman kok.")
    if (!yakin) return
    
    const { data: { user } } = await supabase.auth.getUser()
    setLoading(true)
    try {
      const { error } = await supabase.from('coin_history').delete().eq('user_id', user.id)
      if (error) throw error
      alert('Semua history coin lu udah bersih total!')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 4. DELETE ALL WATCHLIST (ID PLAYER)
  const deleteWatchlist = async () => {
    const yakin = confirm("Semua daftar ID PLAYER lu bakal dihapus. Yakin?")
    if (!yakin) return

    const { data: { user } } = await supabase.auth.getUser()
    setLoading(true)
    try {
      const { error } = await supabase.from('monitored_players').delete().eq('user_id', user.id)
      if (error) throw error
      alert('Semua daftar ID player lu udah dihapus!')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#020617', backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#38bdf8' }}>🛠 ADMIN CONTROL</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid #334155', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>BACK TO DASHBOARD</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* BLOCK 1: UPLOAD CSV */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '30px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #334155', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ marginTop: 0, color: '#00ff88' }}>01. DATA INJECTION (CSV)</h3>
          <textarea style={{ width: '100%', background: '#000', color: '#00ff88', padding: '15px', border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'monospace', boxSizing: 'border-box' }} rows="6" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder='Paste CSV here...' />
          <button disabled={loading} onClick={handleUpload} style={{ marginTop: '15px', padding: '12px 30px', backgroundColor: '#00ff88', border: 'none', cursor: 'pointer', fontWeight: '900', borderRadius: '8px', color: '#020617' }}>
            {loading ? 'EXECUTING...' : 'UPLOAD & SYNC'}
          </button>
        </div>

        {/* BLOCK 2: REGISTER PROTOCOLS */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '30px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #334155', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8' }}>02. PROTOCOL REGISTRATION</h3>
          <textarea style={{ width: '100%', background: '#000', color: '#fff', padding: '15px', border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'monospace', boxSizing: 'border-box' }} rows="4" value={listPlayerIds} onChange={(e) => setListPlayerIds(e.target.value)} placeholder="Ex: player123, player456..." />
          <button disabled={loading} onClick={addMultiplePlayers} style={{ marginTop: '15px', padding: '12px 30px', backgroundColor: '#38bdf8', color: '#020617', border: 'none', cursor: 'pointer', fontWeight: '900', borderRadius: '8px' }}>
            REGISTER PROTOCOLS
          </button>
        </div>

        {/* BLOCK 3: DANGER ZONE */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '30px', borderRadius: '16px', border: '1px solid #ef4444' }}>
          <h3 style={{ marginTop: 0, color: '#ef4444' }}>03. DANGER ZONE</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>Hapus data yang nggak perlu biar dashboard lu tetep enteng.</p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button disabled={loading} onClick={deleteHistory} style={{ flex: 1, padding: '15px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>
              {loading ? 'CLEANING...' : 'HAPUS HISTORY COIN'}
            </button>
            <button disabled={loading} onClick={deleteWatchlist} style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>
              {loading ? 'CLEANING...' : 'HAPUS LIST ID PLAYER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}