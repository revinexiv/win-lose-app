"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function AdminPanel() {
  const [csvText, setCsvText] = useState('')
  const [listPlayerIds, setListPlayerIds] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. UPLOAD CSV HISTORY (WITH EXTRA CLEANING & CHUNKING)
  const handleUpload = async () => {
    if (!csvText) return alert('Isi dulu datanya, Bos!')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Sesi abis, login lagi dah!')

    setLoading(true)
    try {
      // Split baris & hapus baris kosong
      const rows = csvText.split('\n').filter(row => row.trim() !== '')
      
      // Lewati header (slice 1) dan proses pembersihan
      const dataToInsert = rows.slice(1).map(row => {
        // Regex untuk split koma tapi abaikan koma di dalam tanda kutip
        const col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        
        // Membersihkan ID Player (TO) dari semua spasi dan karakter aneh
        // Hanya menyisakan Huruf dan Angka
        const cleanTo = col[2]?.replace(/"/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim()
        
        if (!cleanTo) return null

        return {
          "Date ": col[0]?.replace(/"/g, '').trim(),
          "Info": col[1]?.replace(/"/g, '').trim(),
          "TO": cleanTo,
          "BY": col[3]?.replace(/"/g, '').trim(),
          "Coin": parseFloat(col[4]?.replace(/"/g, '').replace(/,/g, '')) || 0,
          "Last Coin": parseFloat(col[5]?.replace(/"/g, '').replace(/,/g, '')) || 0,
          "user_id": user.id
        }
      }).filter(item => item !== null)

      // Upload Bertahap (Per 500 Baris) agar tidak gagal/timeout
      const chunkSize = 500
      for (let i = 0; i < dataToInsert.length; i += chunkSize) {
        const chunk = dataToInsert.slice(i, i + chunkSize)
        const { error } = await supabase.from('coin_history').upsert(chunk)
        if (error) throw error
        console.log(`Uploaded chunk ${i / chunkSize + 1} (${chunk.length} rows)`)
      }

      alert(`Mantap Bos Riku! ${dataToInsert.length} baris history sudah BERSIH dan masuk.`)
      setCsvText('')
    } catch (err) {
      console.error(err)
      alert('Error Upload: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. REGISTER MULTIPLE PLAYER IDS (WITH EXTRA CLEANING)
  const addMultiplePlayers = async () => {
    if (!listPlayerIds) return alert('Isi dulu list ID-nya!')
    const { data: { user } } = await supabase.auth.getUser()
    
    setLoading(true)
    try {
      // Pisahkan pakai koma atau enter, hapus SEMUA karakter selain huruf/angka
      const rawIds = listPlayerIds
        .split(/[\n,]+/) 
        .map(id => id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim())
        .filter(id => id !== '')

      // Hilangkan duplikat
      const uniqueIds = [...new Set(rawIds)]
      
      const dataToInsert = uniqueIds.map(id => ({ 
        player_id: id, 
        user_id: user.id 
      }))
      
      const { error } = await supabase.from('monitored_players').upsert(dataToInsert, {
        onConflict: 'user_id, player_id'
      })

      if (error) throw error

      alert(`Gokil! ${uniqueIds.length} ID Player berhasil dibersihkan & didaftarkan.`)
      setListPlayerIds('')
    } catch (err) {
      alert('Gagal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. DELETE HISTORY COIN ONLY
  const deleteHistory = async () => {
    const yakin = confirm("Yakin mau hapus SEMUA HISTORY COIN lu, Bos Riku?")
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

  // 4. DELETE ALL WATCHLIST
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
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '30px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #334155', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ marginTop: 0, color: '#00ff88' }}>01. DATA INJECTION (CSV)</h3>
          <p style={{fontSize:'12px', color: '#94a3b8', marginBottom: '10px'}}>Paste CSV lu di sini. Sistem otomatis hapus spasi kotor di ID Player.</p>
          <textarea style={{ width: '100%', background: '#000', color: '#00ff88', padding: '15px', border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'monospace', boxSizing: 'border-box' }} rows="6" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder='Date, Info, TO, BY, Coin, Last Coin...' />
          <button disabled={loading} onClick={handleUpload} style={{ marginTop: '15px', padding: '12px 30px', backgroundColor: '#00ff88', border: 'none', cursor: 'pointer', fontWeight: '900', borderRadius: '8px', color: '#020617' }}>
            {loading ? 'EXECUTING CLEANING...' : 'UPLOAD & CLEAN SYNC'}
          </button>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '30px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #334155', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8' }}>02. PROTOCOL REGISTRATION (LIST ID)</h3>
          <p style={{fontSize:'12px', color: '#94a3b8', marginBottom: '10px'}}>Masukkan list ID. Spasi atau simbol bakal dihapus otomatis.</p>
          <textarea style={{ width: '100%', background: '#000', color: '#fff', padding: '15px', border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'monospace', boxSizing: 'border-box' }} rows="4" value={listPlayerIds} onChange={(e) => setListPlayerIds(e.target.value)} placeholder="Ex: player123, player456..." />
          <button disabled={loading} onClick={addMultiplePlayers} style={{ marginTop: '15px', padding: '12px 30px', backgroundColor: '#38bdf8', color: '#020617', border: 'none', cursor: 'pointer', fontWeight: '900', borderRadius: '8px' }}>
            REGISTER CLEAN PROTOCOLS
          </button>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '30px', borderRadius: '16px', border: '1px solid #ef4444' }}>
          <h3 style={{ marginTop: 0, color: '#ef4444' }}>03. DANGER ZONE</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button disabled={loading} onClick={deleteHistory} style={{ flex: 1, padding: '15px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>HAPUS SEMUA HISTORY</button>
            <button disabled={loading} onClick={deleteWatchlist} style={{ flex: 1, padding: '15px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px' }}>KOSONGKAN WATCHLIST</button>
          </div>
        </div>
      </div>
    </div>
  )
}