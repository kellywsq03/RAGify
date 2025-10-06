'use client'
import { useState, useContext } from 'react'
import { UserIdContext } from '../../components/UserProvider';
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const context = useContext(UserIdContext);
  const router = useRouter();
  if (!context) throw new Error('UserIdContext not found');
  const { userId, setUserId } = context;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('Logging in...')
    try{
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Error: ${data.message || 'Login failed'}`)
        return
      }
      setUserId(data.user.id)
      setMessage('Logged in successfully!')
      router.push("/")
    } catch (err: unknown){
      const message = err instanceof Error ? err.message : 'Login failed'
      setMessage(`Error: ${message}`)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('Creating account...')

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      const res = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(`Error: ${data.message || 'Signup failed'}`)
        return
      }
      setMessage('Account created! Please log in.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setMessage(`Error: ${message}`)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-md bg-black text-white py-2 dark:bg-white dark:text-black"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={handleSignup}
            className="flex-1 rounded-md border py-2 dark:border-gray-700"
          >
            Sign Up
          </button>
        </div>
        {message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}
      </form>
    </main>
  )
}
