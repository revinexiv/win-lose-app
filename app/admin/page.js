"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function AdminPanel() {
  const [csvText, setCsvText] = useState('')
  const [listPlayerIds, setListPlayerIds] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. Fungsi Upload History (Anti-Duplicate)
  const handleUpload = async () => {
    if (!csvText) return alert('Isi dulu datanya, Bos!')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Sesi abis, login lagi dah!')

    setLoading(true)
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
    setLoading(false)
  }

  // 2. Fungsi Tambah ID (Perfect Filtering - Anti Error 'Second Time')
  const addMultiplePlayers = async () => {
    if (!listPlayerIds) return alert('Isi dulu list ID-nya!')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Login dulu!')

    setLoading(true)
    
    // --- LOGIC ANTI ERROR DISINI ---
    // Pecah input, bersihin spasi, buang baris kosong
    const rawIds = listPlayerIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id !== '')
    
    // Filter ID yang kembar di dalam satu list input pake 'Set'
    const uniqueIds = [...new Set(rawIds)]
    
    const dataToInsert = uniqueIds.map(id => ({ 
      player_id: id,
      user_id: user.id 
    }))

    const { error } = await supabase
      .from('monitored_players')
      .upsert(dataToInsert, { 
        onConflict: 'player_id,user_id', 
        ignoreDuplicates: false 
      })

    if (error) {
      alert('Gagal: ' + error.message)
    } else { 
      alert(`Mantap! ${uniqueIds.length} ID berhasil diproses.`); 
      setListPlayerIds(''); 
    }
    setLoading(false)
  }

  // 3. Fungsi Hapus (Hanya milik user login)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#00ff88' }}>🛠 Riku Admin Control</h1>
        <button onClick={() => window.location.href = '/'} style={{ background: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>KEMBALI KE HOME</button>
      </div>
      <hr style={{ borderColor: '#333', marginBottom: '30px' }} />
      
      {/* 1. SEKSI UPLOAD */}
      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
        <h3 style={{ marginTop: 0 }}>1. Paste Data History Coin (CSV)</h3>
        <textarea style={{ width: '100%', background: '#000', color: '#0f0', padding: '10px', border: '1px solid #444', borderRadius: '5px' }} rows="5" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder='Paste CSV di sini...' />
        <button disabled={loading} onClick={handleUpload} style={{ marginTop: '10px', padding: '12px 25px', backgroundColor: '#00ff88', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px', color: '#000' }}>
          {loading ? 'UPLOADING...' : 'UPLOAD HISTORY'}
        </button>
      </div>

      {/* 2. SEKSI WATCHLIST */}
      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
        <h3 style={{ marginTop: 0 }}>2. Tambah List ID Pantauan (Massal)</h3>
        <p style={{ color: '#888', fontSize: '13px' }}>Bisa dipisahkan koma atau baris baru.</p>
        <textarea style={{ width: '100%', background: '#000', color: '#fff', padding: '10px', border: '1px solid #444', borderRadius: '5px' }} rows="3" value={listPlayerIds} onChange={(e) => setListPlayerIds(e.target.value)} placeholder="player1, player2, player3..." />
        <button disabled={loading} onClick={addMultiplePlayers} style={{ marginTop: '10px', padding: '12px 25px', backgroundColor: '#0088ff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>
          {loading ? 'PROSESING...' : 'PANTAU SEMUA ID'}
        </button>
      </div>

      {/* 3. DANGER ZONE */}
      <div style={{ background: '#2d1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #ff4444' }}>
        <h3 style={{ color: '#ff4444', marginTop: 0 }}>⚠️ Danger Zone</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={clearHistory} style={{ padding: '10px 15px', backgroundColor: '#ff4444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>HAPUS SEMUA HISTORY COIN</button>
          <button onClick={clearWatchlist} style={{ padding: '10px 15px', backgroundColor: '#ff9900', color: 'black', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' }}>KOSONGKAN DAFTAR PANTAU</button>
        </div>
      </div>
    </div>
  )
}