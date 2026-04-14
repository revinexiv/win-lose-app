"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function Home() {
  const [rekap, setRekap] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
    // 1. Ambil list ID yang dipantau oleh user yang login
    const { data: { user } } = await supabase.auth.getUser()
    const { data: watchList } = await supabase
      .from('monitored_players')
      .select('player_id')
      .eq('user_id', user?.id)
      
    const allowedIds = watchList?.map(item => item.player_id) || []

    if (allowedIds.length === 0) {
      setRekap([])
      setLoading(false)
      return
    }

    // 2. Ambil semua history yang TO-nya ada di watchlist
    const { data: historyData } = await supabase
      .from('coin_history')
      .select('*')
      .in('TO', allowedIds)

    if (historyData) {
      const summary = historyData.reduce((acc, item) => {
        const name = item["TO"]
        if (!acc[name]) {
          acc[name] = { name, total: 0, count: 0 }
        }

        const amount = parseFloat(item["Coin"]) || 0
        // Bersihkan info: hapus spasi, bikin huruf gede semua biar akurat
        const info = item["Info"] ? item["Info"].toString().toUpperCase().trim() : ''

        // --- LOGIKA PERHITUNGAN RIKU (PERFECT VERSION) ---

        // A. Abaikan data yang ada kata 'REJECT' atau 'CANCEL'
        if (info.includes('REJECT') || info.includes('CANCEL')) {
          return acc 
        }

        // B. Jika mengandung kata 'WITHDRAW', kurangi total
        if (info.includes('WITHDRAW')) {
          acc[name].total -= amount
          acc[name].count += 1
        } 
        
        // C. Jika mengandung kata 'DEPOSIT', tambah total
        else if (info.includes('DEPOSIT')) {
          acc[name].total += amount
          acc[name].count += 1
        }

        return acc
      }, {})

      const sortedResult = Object.values(summary).sort((a, b) => a.name.localeCompare(b.name))
      setRekap(sortedResult)
    }
    setLoading(false)
  }

  const totalGlobal = rekap.reduce((sum, item) => sum + item.total, 0)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = rekap.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(rekap.length / itemsPerPage)

  return (
    <div style={{ padding: '40px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', marginBottom: '5px' }}>📊 Player Monitoring</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Logika: Deposit - Withdraw</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.href = '/admin'} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #38bdf8', background: 'transparent', color: '#38bdf8', fontWeight: 'bold' }}>
            ADMIN PANEL
          </button>
          <button onClick={fetchData} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#38bdf8', color: '#000', fontWeight: 'bold' }}>
            REFRESH DATA
          </button>
        </div>
      </div>

      {loading ? (
        <p>Menghitung data...</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#334155', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>ID PLAYER</th>
                <th style={{ padding: '15px' }}>STATUS (DEP - WD)</th>
                <th style={{ padding: '15px' }}>SUKSES TRANS.</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((player, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.name}</td>
                  <td style={{ padding: '15px', color: player.total >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    {player.total >= 0 ? '+' : ''}{player.total.toLocaleString()}
                  </td>
                  <td style={{ padding: '15px' }}>{player.count}x</td>
                </tr>
              )) : (
                <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>Belum ada data di watchlist.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0f172a', borderTop: '2px solid #38bdf8' }}>
                <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '18px' }}>TOTAL GLOBAL</td>
                <td style={{ padding: '20px', fontSize: '20px', color: totalGlobal >= 0 ? '#4ade80' : '#f87171', fontWeight: '900' }}>
                  {totalGlobal >= 0 ? '+' : ''}{totalGlobal.toLocaleString()}
                </td>
                <td style={{ padding: '20px' }}></td>
              </tr>
            </tfoot>
          </table>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '5px 15px', cursor: 'pointer' }}>Prev</button>
            <span>Hal. {currentPage} / {totalPages || 1}</span>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '5px 15px', cursor: 'pointer' }}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}