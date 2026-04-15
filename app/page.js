"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function Home() {
  const [rekap, setRekap] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

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
      
      const { data: watchList } = await supabase
        .from('monitored_players')
        .select('player_id')
        .eq('user_id', user?.id)
        
      if (!watchList || watchList.length === 0) {
        setRekap([])
        setLoading(false)
        return
      }

      const summaryMap = new Map()
      watchList.forEach(item => {
        const cleanName = item.player_id.toUpperCase().trim()
        summaryMap.set(cleanName, { name: cleanName, total: 0, count: 0 })
      })

      // --- TEKNIK ANTI LIMIT (LOOP FETCH) ---
      let allHistory = []
      let from = 0
      let to = 999
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('coin_history')
          .select('TO, Coin, Info')
          .range(from, to)

        if (error) throw error
        if (data.length > 0) {
          allHistory = [...allHistory, ...data]
          from += 1000
          to += 1000
        } else {
          hasMore = false
        }
        // Safety break biar ga infinity loop
        if (from > 100000) break 
      }

      // --- PROSES HITUNG TOTAL DATA (16RB+ RECORD) ---
      for (let i = 0; i < allHistory.length; i++) {
        const item = allHistory[i]
        const rawName = item.TO ? item.TO.toString().toUpperCase().trim() : ''
        
        if (summaryMap.has(rawName)) {
          const amount = parseFloat(item.Coin) || 0
          const info = item.Info ? item.Info.toString().toUpperCase().trim() : ''
          
          if (info.includes('REJECT') || info.includes('CANCEL')) continue

          const stats = summaryMap.get(rawName)
          if (info.includes('WITHDRAW')) {
            stats.total -= amount
            stats.count += 1
          } else if (info.includes('DEPOSIT')) {
            stats.total += amount
            stats.count += 1
          }
        }
      }

      const activePlayers = Array.from(summaryMap.values())
        .filter(player => player.count > 0)
        .sort((a, b) => a.name.localeCompare(b.name))

      setRekap(activePlayers)
      setCurrentPage(1)
      
    } catch (err) {
      console.error(err)
      alert("Error Syncing: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalGlobal = rekap.reduce((sum, item) => sum + item.total, 0)
  const totalPages = Math.ceil(rekap.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = rekap.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div style={{ padding: '40px', backgroundColor: '#020617', backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#38bdf8', textShadow: '0 0 20px rgba(56, 189, 248, 0.4)', margin: 0 }}>CLouds Monitor <span style={{ color: '#f8fafc', fontWeight: '200' }}>V1</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Database Sync: <span style={{ color: '#00ff88' }}>ACTIVE</span></p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => window.location.href = '/admin'} style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 'bold' }}>ADMIN</button>
          <button onClick={fetchData} style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#38bdf8', color: '#020617', fontWeight: 'bold' }}>REFRESH</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p style={{ color: '#38bdf8', letterSpacing: '2px' }}>LOADING 16,000+ RECORDS...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
            <span style={{ color: '#94a3b8', fontWeight: '600' }}>TOTAL OPERATING BALANCE</span>
            <span style={{ fontSize: '32px', fontWeight: '900', color: totalGlobal >= 0 ? '#00ff88' : '#ff4444' }}>{totalGlobal >= 0 ? '▲' : '▼'} {totalGlobal.toLocaleString()}</span>
          </div>

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
                {currentItems.map((player, index) => (
                  <tr key={index} className="table-row" style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '18px 20px', fontWeight: '700' }}>{player.name}</td>
                    <td style={{ padding: '18px 20px', color: player.total >= 0 ? '#00ff88' : '#ff4444', fontWeight: '800' }}>{player.total >= 0 ? '+' : ''}{player.total.toLocaleString()}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                      <span style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}>{player.count}x</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}>PREV</button>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{currentPage} / {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', opacity: currentPage >= totalPages ? 0.3 : 1 }}>NEXT</button>
          </div>
        </div>
      )}
      <style jsx>{` .table-row:hover { background-color: rgba(56, 189, 248, 0.05) !important; } `}</style>
    </div>
  )
}