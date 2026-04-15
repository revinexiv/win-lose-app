"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function AdminPanel() {
  const [csvText, setCsvText] = useState('')
  const [listPlayerIds, setListPlayerIds] = useState('')
  const [loading, setLoading] = useState(false)

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

  const addMultiplePlayers = async () => {
    if (!listPlayerIds) return alert('Isi dulu list ID-nya!')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Login dulu!')

    setLoading(true)
    const rawIds = listPlayerIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id !== '')
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
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#020617', 
      backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)',
      color: '#f8fafc', 
      minHeight: '100vh', 
      fontFamily: 'Inter, system-ui, sans-serif' 
    }}>
      
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '900', 
          color: '#38bdf8', 
          textShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
          margin: 0 
        }}>🛠 ADMIN <span style={{ color: '#f8fafc', fontWeight: '200' }}>CONTROL</span></h1>
        <button onClick={() => window.location.href = '/'} style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          color: 'white', 
          border: '1px solid #334155', 
          padding: '10px 20px', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontWeight: '600',
          transition: '0.3s'
        }}>BACK TO DASHBOARD</button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 1. UPLOAD SECTION */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.4)', 
          padding: '30px', 
          borderRadius: '16px', 
          marginBottom: '25px', 
          border: '1px solid #334155',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ marginTop: 0, color: '#00ff88', letterSpacing: '1px' }}>01. DATA INJECTION (CSV)</h3>
          <textarea 
            style={{ 
              width: '100%', background: '#000', color: '#00ff88', padding: '15px', 
              border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'monospace',
              boxSizing: 'border-box'
            }} 
            rows="6" 
            value={csvText} 
            onChange={(e) => setCsvText(e.target.value)} 
            placeholder='Paste CSV raw data here...' 
          />
          <button 
            disabled={loading} 
            onClick={handleUpload} 
            style={{ 
              marginTop: '15px', padding: '12px 30px', backgroundColor: '#00ff88', 
              border: 'none', cursor: 'pointer', fontWeight: '900', borderRadius: '8px', 
              color: '#020617', boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)' 
            }}
          >
            {loading ? 'EXECUTING...' : 'UPLOAD TO CORE'}
          </button>
        </div>

        {/* 2. WATCHLIST SECTION */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.4)', 
          padding: '30px', 
          borderRadius: '16px', 
          marginBottom: '25px', 
          border: '1px solid #334155',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8', letterSpacing: '1px' }}>02. PROTOCOL REGISTRATION</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '10px' }}>Enter IDs separated by comma or new line.</p>
          <textarea 
            style={{ 
              width: '100%', background: '#000', color: '#fff', padding: '15px', 
              border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'monospace',
              boxSizing: 'border-box'
            }} 
            rows="4" 
            value={listPlayerIds} 
            onChange={(e) => setListPlayerIds(e.target.value)} 
            placeholder="Ex: player123, player456..." 
          />
          <button 
            disabled={loading} 
            onClick={addMultiplePlayers} 
            style={{ 
              marginTop: '15px', padding: '12px 30px', backgroundColor: '#38bdf8', 
              color: '#020617', border: 'none', cursor: 'pointer', fontWeight: '900', 
              borderRadius: '8px', boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
            }}
          >
            {loading ? 'SYNCING...' : 'REGISTER PROTOCOLS'}
          </button>
        </div>

        {/* 3. DANGER ZONE */}
        <div style={{ 
          background: 'rgba(28, 25, 23, 0.6)', 
          padding: '30px', 
          borderRadius: '16px', 
          border: '1px solid #451a1a'
        }}>
          <h3 style={{ color: '#ef4444', marginTop: 0, letterSpacing: '1px' }}>⚠️ TERMINATION ZONE</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
            <button onClick={clearHistory} style={{ 
              padding: '12px 20px', backgroundColor: '#ef4444', color: 'white', 
              border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' 
            }}>WIPE ALL HISTORY</button>
            <button onClick={clearWatchlist} style={{ 
              padding: '12px 20px', backgroundColor: '#f97316', color: 'black', 
              border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: '900' 
            }}>PURGE WATCHLIST</button>
          </div>
        </div>

      </div>
    </div>
  )
}