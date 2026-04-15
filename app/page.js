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

      const { data: historyData, error } = await supabase
        .from('coin_history')
        .select('TO, Coin, Info')
        .range(0, 99999)

      if (error) throw error

      if (historyData) {
        for (let i = 0; i < historyData.length; i++) {
          const item = historyData[i]
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
      }

      const sortedResult = Array.from(summaryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setRekap(sortedResult)
      
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalGlobal = rekap.reduce((sum, item) => sum + item.total, 0)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = rekap.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(rekap.length / itemsPerPage)

  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#020617', // Darker background
      backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)',
      color: '#f8fafc', 
      minHeight: '100vh', 
      fontFamily: 'Inter, system-ui, sans-serif' 
    }}>
      
      {/* HEADER SECTION */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginBottom: '40px',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '900', 
            letterSpacing: '-1px', 
            color: '#38bdf8', 
            textShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            margin: 0
          }}>
            SYSTEM MONITOR <span style={{ color: '#f8fafc', fontWeight: '200' }}>v2.0</span>
          </h1>
          <p style={{ color: '#94a3b8', margin: '5px 0 0 0', fontSize: '14px' }}>Logika Kalkulasi: <span style={{ color: '#00ff88' }}>DEPOSIT</span> - <span style={{ color: '#ff4444' }}>WITHDRAW</span></p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => window.location.href = '/admin'} style={{ 
            padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #38bdf8', 
            background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 'bold', transition: '0.3s'
          }}>ADMIN PANEL</button>
          <button onClick={fetchData} style={{ 
            padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', 
            background: '#38bdf8', color: '#020617', fontWeight: 'bold', boxShadow: '0 0 15px rgba(56, 189, 248, 0.5)'
          }}>REFRESH CORE</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="spinner" style={{ border: '4px solid #1e293b', borderTop: '4px solid #38bdf8', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p style={{ color: '#38bdf8', letterSpacing: '2px' }}>SYNCING DATA...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* TOTAL GLOBAL CARD */}
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            padding: '30px', 
            borderRadius: '16px', 
            marginBottom: '30px', 
            border: '1px solid #334155',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Operating Balance</span>
            <span style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              color: totalGlobal >= 0 ? '#00ff88' : '#ff4444',
              textShadow: totalGlobal >= 0 ? '0 0 20px rgba(0, 255, 136, 0.3)' : '0 0 20px rgba(255, 68, 68, 0.3)'
            }}>
              {totalGlobal >= 0 ? '▲' : '▼'} {totalGlobal.toLocaleString()}
            </span>
          </div>

          {/* TABLE SECTION */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)', 
            borderRadius: '16px', 
            border: '1px solid #1e293b', 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(51, 65, 85, 0.5)', textAlign: 'left' }}>
                  <th style={{ padding: '20px', fontSize: '13px', textTransform: 'uppercase', color: '#94a3b8' }}>Protocol / ID Player</th>
                  <th style={{ padding: '20px', fontSize: '13px', textTransform: 'uppercase', color: '#94a3b8' }}>Status Win/Lose</th>
                  <th style={{ padding: '20px', fontSize: '13px', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'center' }}>Cycles</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((player, index) => (
                  <tr key={index} className="table-row" style={{ borderBottom: '1px solid #1e293b', transition: '0.2s' }}>
                    <td style={{ padding: '18px 20px', fontWeight: '700', color: '#f8fafc', fontSize: '15px' }}>{player.name}</td>
                    <td style={{ 
                      padding: '18px 20px', 
                      color: player.total >= 0 ? '#00ff88' : '#ff4444', 
                      fontWeight: '800',
                      fontSize: '16px'
                    }}>
                      {player.total >= 0 ? '+' : ''}{player.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '18px 20px', textAlign: 'center', color: '#64748b' }}>
                      <span style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>{player.count} OPS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
              style={{ background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
            >PREV</button>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{currentPage} / {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(prev => prev + 1)}
              style={{ background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
            >NEXT</button>
          </div>
        </div>
      )}

      {/* Tambahan CSS buat animasi spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .table-row:hover {
          background-color: rgba(56, 189, 248, 0.05) !important;
        }
      `}</style>
    </div>
  )
}