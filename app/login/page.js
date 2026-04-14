"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient('https://pojufnunvogdxvuiardl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvanVmbnVudm9nZHh2dWlhcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDI4ODcsImV4cCI6MjA5MTcxODg4N30.5gr92MBKcQFraDZJTyw_2iERfjPmWU7uAnDhNWSWewc')

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // FUNGSI DAFTAR (SIGN UP)
  const handleSignUp = async () => {
    // 1. Validasi Input Kosong
    if (!email || !password) {
      return alert('Woi Bos! Email ama Password jangan dikosongin dong.')
    }

    // 2. Validasi Panjang Password (Syarat Supabase)
    if (password.length < 6) {
      return alert('Password minimal 6 karakter ya biar aman!')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          // Mengarahkan balik ke web kita setelah daftar
          emailRedirectTo: window.location.origin 
        }
      })
      
      if (error) throw error

      // 3. Cek apakah user beneran kedaftar di database
      if (data.user) {
        // Cek apakah butuh konfirmasi email atau langsung masuk
        if (data.session) {
          alert('Pendaftaran Berhasil! Akun lu udah aktif.')
          router.push('/')
        } else {
          alert('Pendaftaran Berhasil! Cek inbox email lu buat konfirmasi (kalo fitur konfirmasi email nyala). Kalo kaga nyala, coba langsung LOGIN aja.')
        }
      }
    } catch (err) {
      alert("Gagal Daftar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // FUNGSI MASUK (LOGIN)
  const handleLogin = async () => {
    if (!email || !password) {
      return alert('Isi dulu email ama passwordnya, baru bisa masuk!')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) throw error

      if (data.session) {
        router.push('/') // Berhasil masuk
      } else {
        alert('Login gagal, sesi tidak ditemukan.')
      }
    } catch (err) {
      alert("Gagal Login: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#121212', color: 'white', minHeight: '100vh', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#00ff88' }}>🔐 Riku Monitor Login</h1>
      <p style={{ color: '#888' }}>Pastikan daftar dengan email aktif.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '350px', margin: '40px auto', background: '#1e1e1e', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
        <input 
          type="email" 
          placeholder="Email Lu" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #333', background: '#000', color: 'white' }} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #333', background: '#000', color: 'white' }} 
        />
        
        <button 
          disabled={loading}
          onClick={handleLogin} 
          style={{ padding: '12px', backgroundColor: '#00ff88', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}
        >
          {loading ? 'SABAR...' : 'MASUK (LOGIN)'}
        </button>

        <div style={{ margin: '10px 0', color: '#444' }}>──────── OR ────────</div>

        <button 
          disabled={loading}
          onClick={handleSignUp} 
          style={{ padding: '12px', backgroundColor: 'transparent', border: '1px solid #0088ff', color: '#0088ff', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'LAGI DAFTAR...' : 'BUAT AKUN BARU'}
        </button>
      </div>
    </div>
  )
}