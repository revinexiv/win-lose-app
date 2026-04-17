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
      if (!user) throw new Error("User session not found");

      const { data, error } = await supabase.rpc('get_precise_rekap', { 
        p_user_id: user.id 
      })

      if (error) throw error;

      const sortedData = (data || []).sort((a, b) => a.player_id.localeCompare(b.player_id));
      setRekap(sortedData);
      setCurrentPage(1);
      
    } catch (err) {
      console.error(err.message);
      alert("Error Syncing: " + err.message);
    } finally {
      setLoading(false)
    }
  }

  // --- FITUR DOWNLOAD REPORT (FULL TRACKING) ---
  const downloadReport = () => {
    if (!rekap || rekap.length === 0) return alert('Gak ada data buat didownload, Bos!');

    // Header sesuai request (huruf kecil)
    const header = "id,net profit/loss,ops\n";

    // Mapping data dari state 'rekap' (full data, bukan currentItems)
    const csvContent = rekap.map(item => {
      const id = String(item.player_id).toLowerCase();
      const profit = String(item.total_profit).toLowerCase();
      const ops = String(item.transaction_count).toLowerCase();
      return `${id},${profit},${ops}`;
    }).join("\n");

    const fullCsv = header + csvContent;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_all_protocols_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalGlobal = rekap.reduce((sum, item) => sum + parseFloat(item.total_profit), 0)
  const totalPages = Math.ceil(rekap.length / itemsPerPage)
  const currentItems = rekap.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div style={{ padding: '40px', backgroundColor: '#020617', backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#38bdf8', textShadow: '0 0 20px rgba(56, 189, 248, 0.4)', margin: 0 }}>CLouds Monitor <span style={{ color: '#f8fafc', fontWeight: '200' }}>V1</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>
            Tracking: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{rekap.length} Active Protocols</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* TOMBOL DOWNLOAD REPORT */}
          <button 
            onClick={downloadReport} 
            style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 'bold' }}
          >
            DOWNLOAD REPORT
          </button>
          
          <button onClick={() => window.location.href = '/admin'} style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #94a3b8', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', fontWeight: 'bold' }}>ADMIN</button>
          <button onClick={fetchData} style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#38bdf8', color: '#020617', fontWeight: 'bold' }}>REFRESH</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p style={{ color: '#38bdf8', letterSpacing: '2px', fontWeight: 'bold' }}>EXECUTING PRECISE SERVER-SIDE CALCULATION...</p>
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
                {currentItems.length > 0 ? currentItems.map((player, index) => (
                  <tr key={index} className="table-row" style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '18px 20px', fontWeight: '700' }}>{player.player_id}</td>
                    <td style={{ padding: '18px 20px', color: player.total_profit >= 0 ? '#00ff88' : '#ff4444', fontWeight: '800' }}>{player.total_profit >= 0 ? '+' : ''}{parseFloat(player.total_profit).toLocaleString()}</td>
                    <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                      <span style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}>{player.transaction_count}x</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data transaksi yang ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}>PREV</button>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}>NEXT</button>
          </div>
        </div>
      )}
      <style jsx>{` .table-row:hover { background-color: rgba(56, 189, 248, 0.05) !important; } `}</style>
    </div>
  )
}