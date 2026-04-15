"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function Home() {
  const [rekap, setRekap] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 // Lu bisa ganti jadi 20 atau 50 kalau mau lebih panjang

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
      } else {
        fetchData()
      }
    }
    checkUser()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Ambil Watchlist ID
      const { data: watchList } = await supabase
        .from('monitored_players')
        .select('player_id')
        .eq('user_id', user?.id)

      if (!watchList || watchList.length === 0) {
        setRekap([])
        setLoading(false)
        return
      }

      const monitoredIds = watchList.map(item => item.player_id.toUpperCase().trim())

      // 2. Tarik data dari Materialized View
      const { data: viewData, error: viewError } = await supabase
        .from('player_rekap_view')
        .select('*')
        .eq('user_id', user?.id)
        .in('player_id', monitoredIds)

      if (viewError) throw viewError

      // 3. Gabungkan dan urutkan
      const formattedData = (viewData || []).map(item => ({
        name: item.player_id,
        total: item.total_profit || 0,
        count: item.transaction_count || 0
      })).sort((a, b) => a.name.localeCompare(b.name))

      setRekap(formattedData)
      setCurrentPage(1) // Reset ke hal 1 tiap refresh
    } catch (err) {
      console.error("Gagal tarik data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Logic Pagination
  const totalGlobal = rekap.reduce((sum, item) => sum + item.total, 0)
  const totalPages = Math.ceil(rekap.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = rekap.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div style={{ padding: '40px', backgroundColor: '#020617', backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER & AUTO COUNT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#38bdf8', textShadow: '0 0 20px rgba(56, 189, 248, 0.4)', margin: 0 }}>CLouds Monitor <span style={{ color: '#f8fafc', fontWeight: '200' }}>V1</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>
            Tracking: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{rekap.length} Protocols Loaded</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => window.location.href = '/admin'} style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 'bold' }}>ADMIN</button>
          <button onClick={fetchData} style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#38bdf8', color: '#020617', fontWeight: 'bold' }}>REFRESH</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p style={{ color: '#38bdf8', letterSpacing: '2px' }}>SYNCING DATABASE...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* TOTAL BALANCE CARD */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
            <span style={{ color: '#94a3b8', fontWeight: '600' }}>TOTAL OPERATING BALANCE</span>
            <span style={{ fontSize: '32px', fontWeight: '900', color: totalGlobal >= 0 ? '#00ff88' : '#ff4444' }}>{totalGlobal >= 0 ? '▲' : '▼'} {totalGlobal.toLocaleString()}</span>
          </div>

          {/* TABLE */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(51, 65, 85, 0.5)', textAlign: 'left' }}>
                  <th style={{ padding: '20px', color: '#94a3b8', fontSize: '12px' }}>PROTOCOL / ID PLAYER</th>
                  <th style={{ padding: '20px', color: '#94a3b8', fontSize: '12px' }}>NET PROFIT/LOSS</th>
                  <th style={{ padding: '20px', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>OPS</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map((player, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '18px 20px', fontWeight: '700' }}>{player.name}</td>
                    <td style={{ padding: '18px 20px', color: player.total >= 0 ? '#00ff88' : '#ff4444', fontWeight: '800' }}>{player.total >= 0 ? '+' : ''}{player.total.toLocaleString()}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                      <span style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}>{player.count}x</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data transaksi untuk watchlist lu.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '10px 25px', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
            >
              PREV
            </button>
            
            <div style={{ color: '#38bdf8', fontWeight: 'bold', background: 'rgba(56, 189, 248, 0.1)', padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              Page {currentPage} of {totalPages || 1}
            </div>

            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '10px 25px', borderRadius: '8px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.3 : 1 }}
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}