"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation' // Tambahin ini buat pindah halaman

// JANGAN LUPA GANTI PAKE KEY LU SENDIRI
const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      alert("Gagal Daftar: " + error.message)
    } else {
      alert('Pendaftaran Berhasil! Sekarang lu otomatis login.')
      router.push('/') // Lempar ke halaman utama
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      alert("Gagal Login: " + error.message)
    } else {
      router.push('/') // Lempar ke halaman utama
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#121212', color: 'white', minHeight: '100vh', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#00ff88' }}>🔐 Riku Monitor Login</h1>
      <p style={{ color: '#888' }}>Masuk untuk kelola database win/lose lu sendiri.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '350px', margin: '40px auto', background: '#1e1e1e', padding: '30px', borderRadius: '10px' }}>
        <input 
          type="email" 
          placeholder="Email Lu" 
          onChange={e => setEmail(e.target.value)} 
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #333', background: '#000', color: 'white' }} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={e => setPassword(e.target.value)} 
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #333', background: '#000', color: 'white' }} 
        />
        
        <button 
          disabled={loading}
          onClick={handleLogin} 
          style={{ padding: '12px', backgroundColor: '#00ff88', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Sabar...' : 'LOGIN'}
        </button>

        <button 
          disabled={loading}
          onClick={handleSignUp} 
          style={{ background: 'none', color: '#0088ff', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
        >
          Belum punya akun? Klik buat Daftar
        </button>
      </div>
    </div>
  )
}