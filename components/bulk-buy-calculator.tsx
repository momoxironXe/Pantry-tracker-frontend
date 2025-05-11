"use client"

import { useState, useEffect } from "react"
import { Calculator, DollarSign, ShoppingBag, TrendingDown, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

type CalculationResult = {
  optimalQuantity: number
  totalSavings: number
  savingsPercentage: number
  monthsSupply: number
  bulkPrice: number
  regularPrice: number
}

type CalculationHistory = {
  id: string
  itemName: string
  pricePerUnit: number
  bulkQuantity: number
  bulkPrice: number
  monthlyUsage: number
  recommendedQuantity: number
  savingsPercentage: number
  savingsAmount: number
  timeframe: number
  createdAt: string
  message: string
}

export default function BulkBuyCalculator() {
  const [item, setItem] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [bulkQuantity, setBulkQuantity] = useState("")
  const [bulkPrice, setBulkPrice] = useState("")
  const [monthlyUsage, setMonthlyUsage] = useState("")
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [shelfLife, setShelfLife] = useState("12") // Default shelf life in months
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch calculation history on component mount
  useEffect(() => {
    fetchCalculationHistory()
  }, [])

  const fetchCalculationHistory = async () => {
    try {
      setHistoryLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-buy/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch calculation history")
      }

      const data = await response.json()
      setCalculationHistory(data.calculations || [])
    } catch (error) {
      console.error("Error fetching calculation history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const calculateSavings = async () => {
    setError("")

    // Basic validation
    if (!item.trim()) {
      setError("Please enter an item name")
      return
    }

    const pricePerUnitNum = Number.parseFloat(pricePerUnit)
    const bulkQuantityNum = Number.parseInt(bulkQuantity)
    const bulkPriceNum = Number.parseFloat(bulkPrice)
    const monthlyUsageNum = Number.parseFloat(monthlyUsage)
    const shelfLifeNum = Number.parseInt(shelfLife)

    if (isNaN(pricePerUnitNum) || pricePerUnitNum <= 0) {
      setError("Please enter a valid price per unit")
      return
    }

    if (isNaN(bulkQuantityNum) || bulkQuantityNum <= 0) {
      setError("Please enter a valid bulk quantity")
      return
    }

    if (isNaN(bulkPriceNum) || bulkPriceNum <= 0) {
      setError("Please enter a valid bulk price")
      return
    }

    if (isNaN(monthlyUsageNum) || monthlyUsageNum <= 0) {
      setError("Please enter a valid monthly usage")
      return
    }

    // Calculate savings
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("You must be logged in to use this feature")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-buy/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemName: item,
          pricePerUnit: pricePerUnitNum,
          unit: "", // Optional
          monthlyUsage: monthlyUsageNum,
          timeframe: shelfLifeNum,
          bulkQuantity: bulkQuantityNum,
          bulkPrice: bulkPriceNum,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to calculate savings")
      }

      const data = await response.json()

      // Set the result
      setResult({
        optimalQuantity: data.calculation.recommendedQuantity,
        totalSavings: data.calculation.savingsAmount,
        savingsPercentage: data.calculation.savingsPercentage,
        monthsSupply: data.calculation.timeframe,
        bulkPrice: bulkPriceNum / bulkQuantityNum,
        regularPrice: pricePerUnitNum,
      })

      // Refresh calculation history
      fetchCalculationHistory()

      toast.success("Calculation completed successfully")
    } catch (error) {
      console.error("Calculation error:", error)
      setError(error instanceof Error ? error.message : "Error calculating savings. Please check your inputs.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setItem("")
    setPricePerUnit("")
    setBulkQuantity("")
    setBulkPrice("")
    setMonthlyUsage("")
    setResult(null)
    setError("")
  }

  const loadCalculation = (calculation: CalculationHistory) => {
    setItem(calculation.itemName)
    setPricePerUnit(calculation.pricePerUnit.toString())
    setBulkQuantity(calculation.bulkQuantity ? calculation.bulkQuantity.toString() : "")
    setBulkPrice(calculation.bulkPrice ? calculation.bulkPrice.toString() : "")
    setMonthlyUsage(calculation.monthlyUsage.toString())
    setShelfLife(calculation.timeframe.toString())

    // Set result
    setResult({
      optimalQuantity: calculation.recommendedQuantity,
      totalSavings: calculation.savingsAmount,
      savingsPercentage: calculation.savingsPercentage,
      monthsSupply: calculation.timeframe,
      bulkPrice: calculation.bulkPrice / calculation.bulkQuantity,
      regularPrice: calculation.pricePerUnit,
    })
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Buy Calculator</h3>
        <p className="text-sm text-gray-500">
          Calculate how much you can save by buying in bulk based on your usage patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="item" className="block text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              id="item"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="e.g., Rice, Beans, Pasta"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700">
                Regular Price Per Unit
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="pricePerUnit"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="2.99"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="monthlyUsage" className="block text-sm font-medium text-gray-700">
                Monthly Usage (Units)
              </label>
              <input
                type="number"
                id="monthlyUsage"
                value={monthlyUsage}
                onChange={(e) => setMonthlyUsage(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="4"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bulkQuantity" className="block text-sm font-medium text-gray-700">
                Bulk Package Quantity
              </label>
              <input
                type="number"
                id="bulkQuantity"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="12"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="bulkPrice" className="block text-sm font-medium text-gray-700">
                Bulk Package Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="bulkPrice"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="29.99"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-green-600 hover:text-green-500 font-medium"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-3">
                <label htmlFor="shelfLife" className="block text-sm font-medium text-gray-700">
                  Item Shelf Life (months)
                </label>
                <select
                  id="shelfLife"
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This helps calculate the maximum amount you should buy to avoid waste.
                </p>
              </div>
            )}
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={calculateSavings}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" /> Calculate Savings
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          {result && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <h4 className="font-medium text-green-800 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                Savings Analysis for {item}
              </h4>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Recommended Purchase</p>
                  <p className="text-xl font-bold text-gray-900 flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2 text-green-600" />
                    Buy {result.optimalQuantity} units
                  </p>
                  <p className="text-sm text-gray-600">({result.monthsSupply.toFixed(1)} month supply)</p>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Total Savings</p>
                  <p className="text-xl font-bold text-green-600">${result.totalSavings.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    ({result.savingsPercentage.toFixed(0)}% less than buying individually)
                  </p>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <p>
                  Regular price: ${result.regularPrice.toFixed(2)} per unit
                  <br />
                  Bulk price: ${result.bulkPrice.toFixed(2)} per unit
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  * This calculation assumes prices remain stable and the product is used consistently.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-medium text-gray-800 mb-3">Recent Calculations</h4>
            {historyLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : calculationHistory.length > 0 ? (
              <div className="space-y-3">
                {calculationHistory.map((calc) => (
                  <div
                    key={calc.id}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadCalculation(calc)}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">{calc.itemName}</p>
                      <p className="text-green-600 font-medium">${calc.savingsAmount.toFixed(2)} saved</p>
                    </div>
                    <p className="text-sm text-gray-600">{calc.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(calc.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No calculation history yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
