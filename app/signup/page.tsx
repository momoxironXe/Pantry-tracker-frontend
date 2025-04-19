"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDataFetching, setIsDataFetching] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    zipCode: "",
    shoppingStyle: "bulk",
  })
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    zipCode: "",
    shoppingStyle: "",
    general: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    let valid = true
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      zipCode: "",
      shoppingStyle: "",
      general: "",
    }

    if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters."
      valid = false
    }

    if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters."
      valid = false
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      newErrors.email = "Please enter a valid email address."
      valid = false
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters."
      valid = false
    }

    if (formData.zipCode.length < 5) {
      newErrors.zipCode = "Please enter a valid ZIP code."
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  // Check data fetch status periodically
  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout | null = null

    if (isDataFetching && token && userId) {
      statusCheckInterval = setInterval(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/data-fetch-status`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error("Failed to check status")
          }

          const data = await response.json()

          if (data.status === "completed") {
            setIsDataFetching(false)
            // Redirect to login page with success message
            router.push("/login?message=Registration%20complete!%20You%20can%20now%20sign%20in.")

            if (statusCheckInterval) {
              clearInterval(statusCheckInterval)
            }
          } else if (data.status === "failed") {
            setIsDataFetching(false)
            setErrors((prev) => ({
              ...prev,
              general: "Data preparation failed. You can still log in, but some product data may be missing.",
            }))

            if (statusCheckInterval) {
              clearInterval(statusCheckInterval)
            }

            // Still redirect to login after a delay
            setTimeout(() => {
              router.push("/login")
            }, 3000)
          }
          // If pending, keep checking
        } catch (error) {
          console.error("Error checking status:", error)
        }
      }, 5000) // Check every 5 seconds
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [isDataFetching, token, userId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          zipCode: formData.zipCode,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong")
      }

      // Store token in localStorage
      localStorage.setItem("token", result.token)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.user._id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          fullName: `${result.user.firstName} ${result.user.lastName}`,
          email: result.user.email,
          zipCode: result.user.zipCode,
          shoppingStyle: result.user.shoppingStyle,
        }),
      )

      // Set token and userId for status checking
      setToken(result.token)
      setUserId(result.user._id)

      // Show data fetching message
      setIsLoading(false)
      setIsDataFetching(true)

      // Redirect to a "please wait" page or show a message
      // We'll show a message in the current page
    } catch (error) {
      console.error("Signup error:", error)
      setErrors((prev) => ({
        ...prev,
        general: error instanceof Error ? error.message : "Failed to create account",
      }))
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
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-gray-600 mt-2">Enter your information to create a Pantry Tracker account</p>
        </div>

        {isDataFetching ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent mb-4"></div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Setting up your account</h2>
              <p className="text-sm text-gray-600 mb-4">
                We're preparing your personalized shopping data. This may take a minute or two.
              </p>
              <p className="text-sm text-gray-500">You'll be redirected to the login page when everything is ready.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>

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

              <div className="mb-4">
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

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="zipCode">
                  ZIP Code
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  placeholder="10001"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1" htmlFor="shoppingStyle">
                  Shopping Style
                </label>
                <select
                  id="shoppingStyle"
                  name="shoppingStyle"
                  value={formData.shoppingStyle}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="bulk">Bulk Buy Shopper</option>
                  <option value="value">Value Shopper</option>
                  <option value="health">Health Conscious</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
