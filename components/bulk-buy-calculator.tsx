"use client"

import { useState } from "react"
import { Calculator, DollarSign, ShoppingBag, TrendingDown } from "lucide-react"

type CalculationResult = {
  optimalQuantity: number
  totalSavings: number
  savingsPercentage: number
  monthsSupply: number
  bulkPrice: number
  regularPrice: number
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

  const calculateSavings = () => {
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
      // Calculate price per unit in bulk
      const bulkPricePerUnit = bulkPriceNum / bulkQuantityNum

      // Calculate savings per unit
      const savingsPerUnit = pricePerUnitNum - bulkPricePerUnit

      // Calculate optimal quantity based on monthly usage and shelf life
      const maxQuantity = Math.min(bulkQuantityNum, monthlyUsageNum * shelfLifeNum)
      const optimalQuantity = Math.max(bulkQuantityNum, Math.ceil(monthlyUsageNum * 3))

      // Calculate total savings
      const totalSavings = savingsPerUnit * optimalQuantity

      // Calculate savings percentage
      const regularTotalPrice = pricePerUnitNum * optimalQuantity
      const savingsPercentage = (totalSavings / regularTotalPrice) * 100

      // Calculate months supply
      const monthsSupply = optimalQuantity / monthlyUsageNum

      setResult({
        optimalQuantity,
        totalSavings,
        savingsPercentage,
        monthsSupply,
        bulkPrice: bulkPricePerUnit,
        regularPrice: pricePerUnitNum,
      })

      // Save calculation to backend (optional)
      saveCalculation({
        item,
        pricePerUnit: pricePerUnitNum,
        bulkQuantity: bulkQuantityNum,
        bulkPrice: bulkPriceNum,
        monthlyUsage: monthlyUsageNum,
        optimalQuantity,
        totalSavings,
        savingsPercentage,
      })
    } catch (err) {
      console.error("Calculation error:", err)
      setError("Error calculating savings. Please check your inputs.")
    } finally {
      setLoading(false)
    }
  }

  const saveCalculation = async (calculationData: any) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return // Don't save if not logged in

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-buy/save-calculation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(calculationData),
      })
    } catch (err) {
      console.error("Error saving calculation:", err)
      // Non-critical error, don't show to user
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

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Buy Calculator</h3>
        <p className="text-sm text-gray-500">
          Calculate how much you can save by buying in bulk based on your usage patterns.
        </p>
      </div>

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
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Calculating...
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

      {result && (
        <div className="mt-6 bg-green-50 border border-green-100 rounded-lg p-4">
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
    </div>
  )
}
