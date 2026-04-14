"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function Home() {
  useEffect(() => {
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login' // Belum login? Tendang ke login!
    } else {
      fetchData()
    }
  }
  checkUser()
}, [])
  const [rekap, setRekap] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: watchList } = await supabase.from('monitored_players').select('player_id')
    const allowedIds = watchList?.map(item => item.player_id) || []

    if (allowedIds.length === 0) {
      setRekap([])
      setLoading(false)
      return
    }

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
  const info = item["Info"] // Kita ambil keterangan transaksinya

  // --- LOGIKA FILTER RIKU ---

  // 1. Cek dulu, kalau ada kata "Reject", langsung skip (abaikan)
  if (info.includes('Reject')) {
    return acc 
  }

  // 2. Kalau keterangannya Withdraw atau Withdraw(PGA-IDF), kurangi total
  if (info === 'Withdraw' || info === 'Withdraw(PGA-IDF)') {
    acc[name].total -= amount
    acc[name].count += 1 // Kita hitung sebagai transaksi sukses
  } 
  
  // 3. Kalau keterangannya Deposit atau Deposit (PGA), tambah total
  else if (info === 'Deposit' || info === 'Deposit (PGA)') {
    acc[name].total += amount
    acc[name].count += 1 // Kita hitung sebagai transaksi sukses
  }

  return acc
}, {})

      const sortedResult = Object.values(summary).sort((a, b) => a.name.localeCompare(b.name))
      setRekap(sortedResult)
    }
    setLoading(false)
  }

  // HITUNG TOTAL GLOBAL (Semua ID yang ada di rekap)
  const totalGlobal = rekap.reduce((sum, item) => sum + item.total, 0)

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = rekap.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(rekap.length / itemsPerPage)

  return (
    <div style={{ padding: '40px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#38bdf8' }}>📊 Player Monitoring</h1>
        <button onClick={fetchData} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', border: 'none', background: '#38bdf8', fontWeight: 'bold' }}>
          REFRESH DATA
        </button>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#334155', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>ID PLAYER</th>
                <th style={{ padding: '15px' }}>TOTAL WIN/LOSE</th>
                <th style={{ padding: '15px' }}>TRANS.</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((player, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.name}</td>
                  <td style={{ padding: '15px', color: player.total >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    {player.total >= 0 ? '+' : ''}{player.total.toLocaleString()}
                  </td>
                  <td style={{ padding: '15px' }}>{player.count}x</td>
                </tr>
              ))}
            </tbody>
            {/* BARIS TOTAL GLOBAL */}
            <tfoot>
              <tr style={{ background: '#0f172a', borderTop: '2px solid #38bdf8' }}>
                <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '18px' }}>TOTAL WINLOSE GLOBAL</td>
                <td style={{ padding: '20px', fontSize: '18px', color: totalGlobal >= 0 ? '#4ade80' : '#f87171', fontWeight: 'black' }}>
                  {totalGlobal >= 0 ? '+' : ''}{totalGlobal.toLocaleString()}
                </td>
                <td style={{ padding: '20px' }}></td>
              </tr>
            </tfoot>
          </table>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
            <span>Halaman {currentPage} dari {totalPages || 1}</span>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}