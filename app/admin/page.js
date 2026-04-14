"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function AdminPanel() {
  const [csvText, setCsvText] = useState('')
  const [listPlayerIds, setListPlayerIds] = useState('')

  const handleUpload = async () => {
    if (!csvText) return alert('Isi dulu datanya, Bos!')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Sesi abis, login lagi dah!')

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
    if (error) alert('Gagal Upload: ' + error.message)
    else { alert('History Berhasil Masuk!'); setCsvText(''); }
  }

  const addMultiplePlayers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Login dulu!')

    const ids = listPlayerIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id !== '')
    const dataToInsert = ids.map(id => ({ 
      player_id: id,
      user_id: user.id 
    }))

    // REVISI DISINI: Kita tegaskan onConflict-nya
    const { error } = await supabase
      .from('monitored_players')
      .upsert(dataToInsert, { 
        onConflict: 'player_id,user_id', // Gunakan kombinasi unik
        ignoreDuplicates: false 
      })

    if (error) {
      console.error(error)
      alert('Gagal: ' + error.message)
    } else { 
      alert(`Mantap! ${ids.length} ID berhasil diproses.`); 
      setListPlayerIds(''); 
    }
  }

  const clearHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (confirm('Yakin mau hapus SEMUA history coin lu?')) {
      const { error } = await supabase.from('coin_history').delete().eq('user_id', user.id)
      if (error) alert('Gagal hapus: ' + error.message)
      else alert('History Coin lu udah bersih!')
    }
  }

  const clearWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (confirm('Yakin mau kosongkan daftar pantauan lu?')) {
      const { error } = await supabase.from('monitored_players').delete().eq('user_id', user.id)
      if (error) alert('Gagal hapus: ' + error.message)
      else alert('Daftar pantau lu udah kosong!')
    }
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#00ff88' }}>🛠 Riku Admin Control</h1>
      <hr style={{ borderColor: '#333', marginBottom: '30px' }} />
      
      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
        <h3>1. Paste Data History Coin (CSV)</h3>
        <textarea style={{ width: '100%', background: '#000', color: '#0f0', padding: '10px', border: '1px solid #444' }} rows="5" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder='Paste CSV di sini...' />
        <button onClick={handleUpload} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#00ff88', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>UPLOAD HISTORY</button>
      </div>

      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
        <h3>2. Tambah List ID Pantauan (Massal)</h3>
        <textarea style={{ width: '100%', background: '#000', color: '#fff', padding: '10px', border: '1px solid #444' }} rows="3" value={listPlayerIds} onChange={(e) => setListPlayerIds(e.target.value)} placeholder="player1, player2, player3..." />
        <button onClick={addMultiplePlayers} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#0088ff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>PANTAU SEMUA ID</button>
      </div>

      <div style={{ background: '#2d1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #ff4444' }}>
        <h3 style={{ color: '#ff4444' }}>⚠️ Danger Zone</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={clearHistory} style={{ padding: '10px', backgroundColor: '#ff4444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>HAPUS SEMUA HISTORY COIN</button>
          <button onClick={clearWatchlist} style={{ padding: '10px', backgroundColor: '#ff9900', color: 'black', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' }}>KOSONGKAN DAFTAR PANTAU</button>
        </div>
      </div>
    </div>
  )
}