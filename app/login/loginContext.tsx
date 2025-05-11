"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  })

  useEffect(() => {
    // Check for message in URL params
    const urlMessage = searchParams.get("message")
    if (urlMessage) {
      setMessage(urlMessage)
    }

    // Check if we need to verify data fetch status
    const email = localStorage.getItem("pendingLoginEmail")
    if (email) {
      setFormData((prev) => ({ ...prev, email }))
      setIsCheckingStatus(true)
      checkDataFetchStatus(email)
    }
  }, [searchParams])

  const checkDataFetchStatus = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/data-fetch-status-by-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to check data fetch status")
      }

      const result = await response.json()

      if (result.status === "completed") {
        setIsCheckingStatus(false)
        localStorage.removeItem("pendingLoginEmail")
        setMessage("Your account is ready! You can now sign in.")
      } else if (result.status === "pending") {
        // Keep checking every 3 seconds
        setTimeout(() => checkDataFetchStatus(email), 3000)
      } else {
        // Either failed or user doesn't exist
        setIsCheckingStatus(false)
        localStorage.removeItem("pendingLoginEmail")
      }
    } catch (error) {
      console.error("Error checking status:", error)
      setIsCheckingStatus(false)
    }
  }

  const checkEmailVerification = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/check-email-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        return result.verified
      }
      return true // Default to true if we can't check
    } catch (error) {
      console.error("Error checking email verification:", error)
      return true // Default to true if we can't check
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    let valid = true
    const newErrors = {
      email: "",
      password: "",
      general: "",
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      newErrors.email = "Please enter a valid email address."
      valid = false
    }

    if (formData.password.length < 1) {
      newErrors.password = "Password is required."
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // First check if email is verified
      const isVerified = await checkEmailVerification(formData.email)

      if (!isVerified) {
        // Redirect to signup page with email pre-filled for verification
        router.push(`/signup?email=${encodeURIComponent(formData.email)}&needsVerification=true`)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if this is a "data still fetching" error
        if (result.dataFetchStatus === "pending") {
          localStorage.setItem("pendingLoginEmail", formData.email)
          setIsCheckingStatus(true)
          setErrors({
            email: "",
            password: "",
            general: "Your account is still being set up. Please wait a moment before signing in.",
          })
          // Start checking status
          checkDataFetchStatus(formData.email)
          setIsLoading(false)
          return
        }

        throw new Error(result.message || "Invalid credentials")
      }

      // Store token and user data in localStorage
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setErrors((prev) => ({
        ...prev,
        general: error instanceof Error ? error.message : "Failed to login",
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center mb-8 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-600 mt-2">Enter your credentials to sign in to your account</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
              {message}
            </div>
          )}

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {errors.general}
            </div>
          )}

          {isCheckingStatus ? (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent mb-4"></div>
              <p className="text-sm text-gray-600">Checking if your account is ready...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="flex justify-end mb-6">
                <Link href="#" className="text-sm text-green-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || isCheckingStatus}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-green-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
