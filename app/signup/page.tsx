"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    zipCode: "",
    shoppingStyle: "value", // Default value
    phoneNumber: "", // Added for SMS alerts
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  // For development mode - store the verification code if provided by the API
  const [devVerificationCode, setDevVerificationCode] = useState<string | null>(null)
  // New state for data loading after verification
  const [dataLoading, setDataLoading] = useState(false)
  const [dataLoadingProgress, setDataLoadingProgress] = useState(0)
  const [dataLoadingMessage, setDataLoadingMessage] = useState("")

  useEffect(() => {
    // Check if we have email and needsVerification in URL params
    const email = searchParams.get("email")
    const needsVerification = searchParams.get("needsVerification")

    if (email && needsVerification === "true") {
      setFormData((prev) => ({ ...prev, email }))
      setStep(3) // Go directly to verification step
      toast.info("Please verify your email to continue")

      // Request a new verification code
      handleResendCode(email)
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return "First name is required"
    if (!formData.lastName.trim()) return "Last name is required"
    if (!formData.email.trim()) return "Email is required"
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Invalid email format"
    if (!formData.password) return "Password is required"
    if (formData.password.length < 8) return "Password must be at least 8 characters"
    if (formData.password !== formData.confirmPassword) return "Passwords do not match"
    return null
  }

  const validateStep2 = () => {
    if (!formData.zipCode.trim()) return "ZIP code is required"
    if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) return "Invalid ZIP code format"
    if (!formData.shoppingStyle) return "Please select your shopping style"
    return null
  }

  const handleNextStep = () => {
    const error = validateStep1()
    if (error) {
      toast.error(error)
      return
    }
    setStep(2)
  }

  const handleSendVerification = async () => {
    const error = validateStep2()
    if (error) {
      toast.error(error)
      return
    }

    setLoading(true)
    try {
      // Register the user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          zipCode: formData.zipCode,
          shoppingStyle: formData.shoppingStyle,
          phoneNumber: formData.phoneNumber || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account")
      }

      // Store token for verification requests
      if (data.token) {
        localStorage.setItem("pendingToken", data.token)
        setUserId(data.user._id)
      }

      // Check if we're in development mode and have a verification code
      if (data.verificationCode) {
        if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_VERIFICATION === "true") {
          console.log("Development mode: Verification code:", data.verificationCode)
        }
        setDevVerificationCode(data.verificationCode)
      }

      setVerificationSent(true)
      toast.success("Verification code sent to your email")
      setStep(3)
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  // Function to check data loading status
  const checkDataLoadingStatus = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/data-fetch-status/${userId}`)

      if (!response.ok) {
        throw new Error("Failed to check data loading status")
      }

      const data = await response.json()

      setDataLoadingProgress(data.progress || 0)
      setDataLoadingMessage(data.message || "Setting up your account...")

      if (data.status === "completed" || data.progress >= 100) {
        setDataLoading(false)
        toast.success("Your account is ready!")
        router.push("/login?message=Your account is ready! You can now sign in.")
      } else if (data.status === "failed") {
        setDataLoading(false)
        toast.error("There was an issue setting up your account. You can still sign in.")
        router.push("/login?message=There was an issue setting up your account. You can still sign in.")
      } else {
        // Continue checking status
        setTimeout(() => checkDataLoadingStatus(userId), 2000)
      }
    } catch (error) {
      console.error("Error checking data loading status:", error)
      // If there's an error, we'll still redirect to login after a delay
      setTimeout(() => {
        setDataLoading(false)
        router.push("/login")
      }, 5000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationCode.trim()) {
      setVerificationError("Please enter the verification code")
      return
    }

    setLoading(true)
    setVerificationError("")

    try {
      // Verify the email with the code
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.message || "Invalid verification code")
      }

      const verifyData = await verifyResponse.json()

      // Get the token from the verification response
      const token = verifyData.token

      // Store the login token and user data
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(verifyData.user))

      // Show data loading screen
      setLoading(false)
      setDataLoading(true)
      setDataLoadingProgress(0)
      setDataLoadingMessage("Initializing your account...")

      // Start checking data loading status
      if (verifyData.user && verifyData.user._id) {
        checkDataLoadingStatus(verifyData.user._id)
      } else if (userId) {
        // Use the userId we stored earlier if available
        checkDataLoadingStatus(userId)
      } else {
        // If for some reason we don't have the user ID, redirect after a delay
        setTimeout(() => {
          setDataLoading(false)
          router.push("/login")
        }, 10000)
      }
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationError(error instanceof Error ? error.message : "Verification failed")
      setLoading(false)
    }
  }

  const handleResendCode = async (emailOverride?: string) => {
    setLoading(true)
    try {
      const email = emailOverride || formData.email

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification code")
      }

      // Check if we're in development mode and have a verification code
      if (data.code) {
        if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_VERIFICATION === "true") {
          console.log("Development mode: New verification code:", data.code)
        }
        setDevVerificationCode(data.code)
      }

      toast.success("Verification code resent to your email")
    } catch (error) {
      console.error("Resend error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to resend verification code")
    } finally {
      setLoading(false)
    }
  }

  // Auto-fill verification code only when explicitly enabled for testing
  useEffect(() => {
    if (
      devVerificationCode &&
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_AUTO_FILL_VERIFICATION === "true"
    ) {
      setVerificationCode(devVerificationCode)
    }
  }, [devVerificationCode])

  // If data is loading, show the loading screen
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your account</h2>
          <p className="text-gray-600 mb-6">{dataLoadingMessage}</p>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${dataLoadingProgress}%` }}
            ></div>
          </div>

          <p className="text-sm text-gray-500">
            We're preparing your personalized shopping experience. This may take a minute...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Track grocery prices and save money on your shopping</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
                </div>
                <span className="text-xs mt-1">Account</span>
              </div>
              <div className={`h-1 flex-1 mx-2 ${step >= 2 ? "bg-green-500" : "bg-gray-200"}`}></div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
                </div>
                <span className="text-xs mt-1">Preferences</span>
              </div>
              <div className={`h-1 flex-1 mx-2 ${step >= 3 ? "bg-green-500" : "bg-gray-200"}`}></div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  3
                </div>
                <span className="text-xs mt-1">Verify</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number (for price alerts)
                  </label>
                  <div className="mt-1">
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="Optional - for SMS price alerts"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    We'll only send alerts for items you choose to track. Standard rates may apply.
                  </p>
                </div>

                <div>
                  <label htmlFor="shoppingStyle" className="block text-sm font-medium text-gray-700">
                    Your Shopping Style
                  </label>
                  <div className="mt-1">
                    <select
                      id="shoppingStyle"
                      name="shoppingStyle"
                      required
                      value={formData.shoppingStyle}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    >
                      <option value="budget">Budget Shopper</option>
                      <option value="prepper">Prepper/Pantry Stocker</option>
                      <option value="seasonal">Seasonal Cook</option>
                      <option value="homesteader">Homesteader/Gardener</option>
                      <option value="clean">Clean Ingredient Shopper</option>
                      <option value="bulk">Bulk Buy Shopper</option>
                      <option value="value">Value Shopper</option>
                    </select>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    This helps us personalize price alerts and recommendations for you.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={loading}
                    className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                  {verificationError && <p className="mt-2 text-sm text-red-600">{verificationError}</p>}
                  <p className="mt-2 text-sm text-gray-500">
                    We've sent a verification code to your email address. Please enter it here to complete your
                    registration.
                  </p>

                  {/* Development verification code is no longer displayed to users */}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => handleResendCode()}
                    disabled={loading}
                    className="text-sm text-green-600 hover:text-green-500"
                  >
                    Resend verification code
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
