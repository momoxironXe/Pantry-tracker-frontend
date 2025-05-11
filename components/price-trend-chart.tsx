"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpIcon, ArrowDownIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

// Types for the component props and data
interface PricePoint {
  date: string
  price: number
  storeName?: string
}

interface PriceHistory {
  weekly: PricePoint[]
  monthly: PricePoint[]
  threeMonth: PricePoint[]
}

interface PriceChange {
  weekly: number
  monthly: number
  threeMonth: number
}

interface PriceTrendChartProps {
  itemName: string
  priceHistory: PriceHistory
  priceChange: PriceChange
  currentPrice: number
  lowestPrice: number
  highestPrice: number
  storeName?: string
  seasonalLow?: boolean
  buyRecommendation?: boolean
  buyRecommendationReason?: string
}

export default function PriceTrendChart({
  itemName,
  priceHistory,
  priceChange,
  currentPrice,
  lowestPrice,
  highestPrice,
  storeName = "Various Stores",
  seasonalLow = false,
  buyRecommendation = false,
  buyRecommendationReason = "",
}: PriceTrendChartProps) {
  const [activeTab, setActiveTab] = useState("weekly")
  const [chartData, setChartData] = useState<PricePoint[]>([])

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  // Format percentage with + or - sign
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  // Update chart data when tab changes or when priceHistory changes
  useEffect(() => {
    if (!priceHistory) {
      setChartData([])
      return
    }

    switch (activeTab) {
      case "weekly":
        setChartData(priceHistory.weekly || [])
        break
      case "monthly":
        setChartData(priceHistory.monthly || [])
        break
      case "threeMonth":
        setChartData(priceHistory.threeMonth || [])
        break
      default:
        setChartData(priceHistory.weekly || [])
    }
  }, [activeTab, priceHistory])

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-sm text-gray-700">Price: {formatPrice(payload[0].value)}</p>
          {payload[0].payload.storeName && (
            <p className="text-xs text-gray-500">Store: {payload[0].payload.storeName}</p>
          )}
        </div>
      )
    }
    return null
  }

  // If no price history data is available
  if (!priceHistory || !priceHistory.weekly || priceHistory.weekly.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span>{itemName}</span>
            <span className="text-lg font-normal">{formatPrice(currentPrice)}</span>
          </CardTitle>
          <CardDescription>No price history available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Price trend data is being collected</p>
            <p className="text-sm text-gray-400">Check back soon for price trends</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{itemName} Price Trends</span>
          <span className="text-lg font-normal">{formatPrice(currentPrice)}</span>
        </CardTitle>
        <CardDescription>Current price at {storeName}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Price change indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Weekly</div>
            <div
              className={`flex items-center font-medium ${priceChange.weekly < 0 ? "text-green-600" : priceChange.weekly > 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {priceChange.weekly < 0 ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : priceChange.weekly > 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : null}
              {formatPercentage(priceChange.weekly)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Monthly</div>
            <div
              className={`flex items-center font-medium ${priceChange.monthly < 0 ? "text-green-600" : priceChange.monthly > 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {priceChange.monthly < 0 ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : priceChange.monthly > 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : null}
              {formatPercentage(priceChange.monthly)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">3 Month</div>
            <div
              className={`flex items-center font-medium ${priceChange.threeMonth < 0 ? "text-green-600" : priceChange.threeMonth > 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {priceChange.threeMonth < 0 ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : priceChange.threeMonth > 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : null}
              {formatPercentage(priceChange.threeMonth)}
            </div>
          </div>
        </div>

        {/* Price insights */}
        {(seasonalLow || buyRecommendation) && (
          <div
            className={`mb-6 p-3 rounded-lg ${seasonalLow ? "bg-blue-50 border border-blue-100" : "bg-green-50 border border-green-100"}`}
          >
            <div className="flex items-start">
              {seasonalLow ? (
                <TrendingDownIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              ) : (
                <TrendingUpIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${seasonalLow ? "text-blue-700" : "text-green-700"}`}>
                  {seasonalLow ? "Seasonal Low Price" : "Good Time to Buy"}
                </p>
                <p className="text-sm mt-1">
                  {buyRecommendationReason ||
                    (seasonalLow
                      ? `Current price is near the seasonal low of ${formatPrice(lowestPrice)}.`
                      : `Price is trending favorably compared to recent history.`)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Price range */}
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Low: {formatPrice(lowestPrice)}</span>
          <span>High: {formatPrice(highestPrice)}</span>
        </div>

        {/* Chart tabs */}
        <Tabs defaultValue="weekly" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="threeMonth">3 Month</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
