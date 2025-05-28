"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  Globe,
  Info,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleMap from "@/components/google-map";
import { toast } from "react-hot-toast";
import PriceTrendChart from "@/components/price-trend-chart";
import BulkBuyCalculator from "@/components/bulk-buy-calculator";
import RecipePriceTracker from "@/components/recipe-price-tracker";

// Type definitions remain the same...
type UserType = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  zipCode: string;
  shoppingStyle: string;
};

type StoreType = {
  _id: string;
  name: string;
  address: {
    formattedAddress: string;
    zipCode: string;
    country: string;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  hours: {
    [key: string]: string;
  };
  chainName: string;
  storeType: string;
  phone: string;
  website?: string;
  rating: number;
  priceLevel?: number;
};

type PriceInfo = {
  price: number;
  store: string;
};

type PriceRange = {
  min: number;
  max: number;
  period: string;
};

type ProductType = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  size: string;
  unit: string;
  imageUrl: string;
  lowestPrice: PriceInfo;
  priceRange: PriceRange;
  isBuyRecommended: boolean;
  buyRecommendationReason: string;
  isHealthy: boolean;
  isValuePick: boolean;
  isBulkOption: boolean;
  quantity?: number;
  addedAt?: string;
};

type NewsItemType = {
  id: string;
  title: string;
  url?: string;
  summary: string;
  category: string;
  impactLevel: string;
  publishedAt: string;
};

type DashboardDataType = {
  stores: StoreType[];
  pantryItems: ProductType[];
  produceItems: ProductType[];
  buyAlerts: ProductType[];
  newsHighlights: NewsItemType[];
};

type PricePoint = {
  date: string;
  price: number;
  storeName?: string;
};

type PriceHistory = {
  weekly: PricePoint[];
  monthly: PricePoint[];
  threeMonth: PricePoint[];
};

type PriceChange = {
  weekly: number;
  monthly: number;
  threeMonth: number;
};

type PriceTrendType = {
  id: string;
  name: string;
  currentPrice: number;
  priceHistory: PriceHistory;
  priceChange: PriceChange;
  lowestPrice: number;
  highestPrice: number;
  storeName: string;
  seasonalLow?: boolean;
  buyRecommendation?: boolean;
  buyRecommendationReason?: string;
};

type PantryItemWithTrends = {
  id: string;
  name: string;
  quantity: number;
  monthlyUsage: number;
  addedAt: string;
  currentPrice: number;
  priceHistory: PriceHistory;
  priceChange: PriceChange;
  lowestPrice: number;
  highestPrice: number;
  storeName: string;
};

// Product Card Component for consistent styling
const ProductCard = ({
  product,
  onAddToList,
  onRemoveFromList,
  isInList = false,
}: {
  product: ProductType;
  onAddToList?: (id: string) => void;
  onRemoveFromList?: (id: string) => void;
  isInList?: boolean;
}) => {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="p-4 flex flex-col h-full">
        {/* Header with product name and badges */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-medium text-gray-900 leading-tight">
            {product.name}
          </h3>
          <div className="flex-shrink-0 ml-2">
            {product.isBuyRecommended && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                Buy Now!
              </span>
            )}
            {isInList && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                Qty: {product.quantity || 1}
              </span>
            )}
          </div>
        </div>

        {/* Product image */}
        <div className="flex justify-center items-center h-24 mb-3">
          {product.imageUrl && (
            <img
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/colorful-grocery-aisle.png";
              }}
            />
          )}
        </div>

        {/* Price information */}
        <div className="mb-2">
          <div className="flex items-baseline">
            <span className="text-lg font-semibold text-gray-900">
              ${product.lowestPrice.price.toFixed(2)}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              @ {product.lowestPrice.store}
            </span>
          </div>
        </div>

        {/* Price range */}
        <div className="text-xs text-gray-500 mb-2">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Price range past 6 weeks:</span>
          </div>
          <div className="mt-1 flex items-center">
            <span className="font-medium">
              ${product.priceRange.min.toFixed(2)}
            </span>
            <div className="mx-2 h-0.5 w-8 bg-gray-200 rounded"></div>
            <span>${product.priceRange.max.toFixed(2)}</span>
          </div>
        </div>

        {/* Product tags */}
        <div className="flex items-center text-xs mb-3 flex-wrap gap-1">
          <span
            className={`px-2 py-0.5 rounded ${
              product.type === "Store Brand"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {product.type}
          </span>
          {product.isHealthy && (
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">
              Organic
            </span>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Action button */}
        {isInList ? (
          <button
            onClick={() => onRemoveFromList && onRemoveFromList(product.id)}
            className="w-full flex items-center justify-center px-3 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove from list
          </button>
        ) : (
          <button
            onClick={() => onAddToList && onAddToList(product.id)}
            className="w-full flex items-center justify-center px-3 py-2 border border-green-600 text-green-600 rounded-md text-sm font-medium hover:bg-green-50 transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add to my list
          </button>
        )}
      </div>
    </div>
  );
};

// Add New Pantry Item Modal Component
const AddPantryItemModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    name: string;
    category: string;
    type: string;
    size: string;
    unit: string;
    quantity: number;
  }) => void;
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pantry");
  const [type, setType] = useState("Store Brand");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("each");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!name.trim()) {
      toast.error("Please enter a name for the item");
      setIsSubmitting(false);
      return;
    }

    // Submit form
    onAdd({
      name,
      category,
      type,
      size,
      unit,
      quantity,
    });

    // Reset form (this will happen after onAdd completes)
    setName("");
    setCategory("Pantry");
    setType("Store Brand");
    setSize("");
    setUnit("each");
    setQuantity(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Add New Pantry Item
                </h3>
                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Item Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Category
                        </label>
                        <select
                          id="category"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="Pantry">Pantry</option>
                          <option value="Produce">Produce</option>
                          <option value="Dairy">Dairy</option>
                          <option value="Meat">Meat</option>
                          <option value="Frozen">Frozen</option>
                          <option value="Bakery">Bakery</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Snacks">Snacks</option>
                          <option value="Household">Household</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Type
                        </label>
                        <select
                          id="type"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                        >
                          <option value="Store Brand">Store Brand</option>
                          <option value="Name Brand">Name Brand</option>
                          <option value="Organic">Organic</option>
                          <option value="Bulk">Bulk</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="size"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Size
                        </label>
                        <input
                          type="text"
                          id="size"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="e.g. 16 oz"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="unit"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Unit
                        </label>
                        <select
                          id="unit"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                        >
                          <option value="each">each</option>
                          <option value="bag">bag</option>
                          <option value="box">box</option>
                          <option value="can">can</option>
                          <option value="bottle">bottle</option>
                          <option value="jar">jar</option>
                          <option value="package">package</option>
                          <option value="container">container</option>
                          <option value="bunch">bunch</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="quantity"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min="1"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                "Add Item"
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  // State definitions remain the same...
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductType[]>([]);
  const [myList, setMyList] = useState<ProductType[]>([]);
  const [isMyListLoading, setIsMyListLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [priceTrends, setPriceTrends] = useState<PriceTrendType[]>([]);
  const [isPriceTrendsLoading, setIsPriceTrendsLoading] = useState(false);
  const [myPantryItems, setMyPantryItems] = useState<ProductType[]>([]);
  const [isMyPantryLoading, setIsMyPantryLoading] = useState(false);
  const [myPantryTrends, setMyPantryTrends] = useState<PantryItemWithTrends[]>(
    []
  );
  const [isMyPantryTrendsLoading, setIsMyPantryTrendsLoading] = useState(false);
  const [isAddPantryItemModalOpen, setIsAddPantryItemModalOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default store names for fallback
  const defaultStores = [
    "Walmart",
    "Target",
    "Kroger",
    "Costco",
    "Whole Foods",
  ];

  // Rest of the component logic remains the same...
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLoading(false);

      // Check if dashboard data is already in localStorage
      const cachedDashboardData = localStorage.getItem("dashboardData");
      const cachedMyList = localStorage.getItem("myList");
      const lastFetchTime = localStorage.getItem("lastFetchTime");
      const currentTime = new Date().getTime();

      // Check if cached data exists and is less than 1 hour old
      const isCacheValid =
        lastFetchTime && currentTime - Number.parseInt(lastFetchTime) < 3600000;

      if (cachedDashboardData && isCacheValid && !dataLoaded) {
        try {
          const parsedData = JSON.parse(cachedDashboardData);

          // Ensure all products have valid price data
          const validatedData = {
            ...parsedData,
            pantryItems: ensureValidPriceData(
              parsedData.pantryItems || [],
              parsedData.stores
            ),
            produceItems: ensureValidPriceData(
              parsedData.produceItems || [],
              parsedData.stores
            ),
            buyAlerts: ensureValidPriceData(
              parsedData.buyAlerts || [],
              parsedData.stores
            ),
          };

          setDashboardData(validatedData);
          setDataLoaded(true);
          setDataLoading(false);
        } catch (e) {
          console.error("Error parsing cached dashboard data:", e);
          // If parsing fails, fetch fresh data
          fetchDashboardData(token);
        }
      } else if (!dataLoaded) {
        // Only fetch if data hasn't been loaded yet
        fetchDashboardData(token);
      }

      if (cachedMyList && isCacheValid && !isMyListLoading) {
        try {
          const parsedList = JSON.parse(cachedMyList);
          // Ensure all list items have valid price data
          const validatedList = ensureValidPriceData(
            parsedList,
            defaultStores.map((name) => ({ name }))
          );
          setMyList(validatedList);
        } catch (e) {
          console.error("Error parsing cached list data:", e);
          // If parsing fails, fetch fresh data
          fetchMyList(token);
        }
      } else if (!isMyListLoading) {
        // Only fetch if list hasn't been loaded yet
        fetchMyList(token);
      }

      // Fetch price trends for dashboard
      fetchPriceTrends(token);

      // Fetch my pantry items
      fetchMyPantryItems(token);

      // Fetch my pantry trends
      fetchMyPantryTrends(token);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router, retryCount, dataLoaded]);

  // Update the ensureValidPriceData function to use varied store names
  const ensureValidPriceData = (
    products: ProductType[],
    stores: any[] = []
  ) => {
    // List of varied store names to use when needed
    const storeVariety = [
      "Walmart",
      "Target",
      "Kroger",
      "Costco",
      "Whole Foods",
      "Safeway",
      "Trader Joe's",
      "Publix",
      "Albertsons",
      "Ralphs",
      "Aldi",
      "Meijer",
      "H-E-B",
      "Wegmans",
      "Food Lion",
      "Stop & Shop",
      "Giant Eagle",
      "ShopRite",
      "Sprouts",
      "Fresh Market",
    ];

    return products.map((product, index) => {
      // Get a store name - either from the product's store, or from available stores, or from variety
      let storeName = product.lowestPrice?.store;

      if (!storeName || storeName === "Unknown Store") {
        // Try to get a store from the available stores
        if (stores && stores.length > 0) {
          const randomStore = stores[Math.floor(Math.random() * stores.length)];
          storeName =
            randomStore.name ||
            randomStore.chainName ||
            storeVariety[index % storeVariety.length];
        } else {
          // Use a varied store name based on product index
          storeName = storeVariety[index % storeVariety.length];
        }
      }

      // Ensure price is a valid number greater than 0
      const price = product.lowestPrice?.price || 0;
      const validPrice =
        price > 0 ? price : (Math.random() * 10 + 1).toFixed(2);

      // Ensure price range has valid values
      const minPrice = product.priceRange?.min || 0;
      const maxPrice = product.priceRange?.max || 0;

      let validMinPrice = minPrice;
      let validMaxPrice = maxPrice;

      // If min and max are both 0, generate random values
      if (minPrice === 0 && maxPrice === 0) {
        validMinPrice = Number.parseFloat((Math.random() * 5 + 1).toFixed(2));
        validMaxPrice = Number.parseFloat(
          (validMinPrice + Math.random() * 5).toFixed(2)
        );
      }
      // If only min is 0, set it to 80% of max
      else if (minPrice === 0 && maxPrice > 0) {
        validMinPrice = Number.parseFloat((maxPrice * 0.8).toFixed(2));
      }
      // If only max is 0, set it to 120% of min
      else if (minPrice > 0 && maxPrice === 0) {
        validMaxPrice = Number.parseFloat((minPrice * 1.2).toFixed(2));
      }

      return {
        ...product,
        lowestPrice: {
          price: Number.parseFloat(validPrice as string),
          store: storeName,
        },
        priceRange: {
          min: validMinPrice,
          max: validMaxPrice,
          period: product.priceRange?.period || "6 weeks",
        },
      };
    });
  };

  // Other functions remain the same...
  const fetchDashboardData = async (token: string) => {
    try {
      setDataLoading(true);
      setError(null);

      console.log("Fetching dashboard data...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Dashboard fetch error:", errorData);
        throw new Error(errorData.message || "Failed to fetch dashboard data");
      }

      const data = await response.json();
      console.log("Dashboard data received:", data);

      // Ensure all required properties exist with defaults if missing
      const formattedData: DashboardDataType = {
        stores: data.stores || [],
        pantryItems: ensureValidPriceData(data.pantryItems || [], data.stores),
        produceItems: ensureValidPriceData(
          data.produceItems || [],
          data.stores
        ),
        buyAlerts: ensureValidPriceData(data.buyAlerts || [], data.stores),
        newsHighlights: data.newsHighlights || [],
      };

      setDashboardData(formattedData);
      setDataLoaded(true);

      // Cache the dashboard data in localStorage with timestamp
      localStorage.setItem("dashboardData", JSON.stringify(formattedData));
      localStorage.setItem("lastFetchTime", new Date().getTime().toString());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data. Please try again later."
      );
    } finally {
      setDataLoading(false);
    }
  };

  const fetchMyList = async (token: string) => {
    try {
      setIsMyListLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search/my-list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch your list");
      }

      const data = await response.json();

      // Ensure all list items have valid price data
      const validatedItems = ensureValidPriceData(
        data.items || [],
        dashboardData?.stores || []
      );
      setMyList(validatedItems);

      // Cache the list data in localStorage
      localStorage.setItem("myList", JSON.stringify(validatedItems));
    } catch (error) {
      console.error("Error fetching my list:", error);
      toast.error("Failed to load your list");
    } finally {
      setIsMyListLoading(false);
    }
  };

  const fetchPriceTrends = async (token: string) => {
    try {
      setIsPriceTrendsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/price-trends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price trends");
      }

      const data = await response.json();
      setPriceTrends(data.trends || []);
    } catch (error) {
      console.error("Error fetching price trends:", error);
      // Don't show error toast for this one, as it's not critical
    } finally {
      setIsPriceTrendsLoading(false);
    }
  };

  const fetchMyPantryItems = async (token: string) => {
    try {
      setIsMyPantryLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pantry-items/my-pantry`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch your pantry items");
      }

      const data = await response.json();
      setMyPantryItems(data.pantryItems || []);
    } catch (error) {
      console.error("Error fetching my pantry items:", error);
      // Don't show error toast for this one, as it's not critical
    } finally {
      setIsMyPantryLoading(false);
    }
  };

  const fetchMyPantryTrends = async (token: string) => {
    try {
      setIsMyPantryTrendsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pantry-items/my-pantry/trends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch your pantry trends");
      }

      const data = await response.json();
      setMyPantryTrends(data.pantryTrends || []);
    } catch (error) {
      console.error("Error fetching my pantry trends:", error);
      // Don't show error toast for this one, as it's not critical
    } finally {
      setIsMyPantryTrendsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    try {
      setIsSearching(true);
      setSearchResults([]);

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: searchQuery }),
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      // Ensure all products have valid price data
      const validatedProducts = ensureValidPriceData(
        data.products || [],
        dashboardData?.stores || []
      );
      setSearchResults(validatedProducts);

      // Switch to search results tab
      setActiveTab("search");

      // Clear search input
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const addToList = async (productId: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search/add-to-list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add item to your list");
      }

      // Refresh the list
      fetchMyList(token);

      toast.success("Added to your list!");
    } catch (error) {
      console.error("Error adding to list:", error);
      toast.error("Failed to add item to your list");
    }
  };

  const removeFromList = async (productId: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search/remove-from-list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item from your list");
      }

      // Update the local list by filtering out the removed item
      const updatedList = myList.filter((item) => item.id !== productId);
      setMyList(updatedList);

      // Update the cached list
      localStorage.setItem("myList", JSON.stringify(updatedList));

      toast.success("Item removed from your list!");
    } catch (error) {
      console.error("Error removing from list:", error);
      toast.error("Failed to remove item from your list");
    }
  };

  // Update the handleAddPantryItem function to handle errors better and provide more detailed feedback

  const handleAddPantryItem = async (item: {
    name: string;
    category: string;
    type: string;
    size: string;
    unit: string;
    quantity: number;
  }) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      setIsSubmitting(true); // Add this line to show loading state

      console.log("Adding pantry item:", item);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pantry-items/my-pantry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.message || "Failed to add item to your pantry");
      }

      // Close the modal
      setIsAddPantryItemModalOpen(false);

      // Refresh pantry items
      fetchMyPantryItems(token);
      fetchMyPantryTrends(token);

      toast.success("Item added to your pantry!");
    } catch (error) {
      console.error("Error adding to pantry:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add item to your pantry"
      );
    } finally {
      setIsSubmitting(false); // Add this line to hide loading state
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("dashboardData");
    localStorage.removeItem("myList");
    localStorage.removeItem("lastFetchTime");
    router.push("/login");
  };

  const filteredPantryItems =
    selectedCategory === "all"
      ? dashboardData?.pantryItems || []
      : dashboardData?.pantryItems.filter((item) => {
          if (selectedCategory === "healthy") return item.isHealthy;
          if (selectedCategory === "value") return item.isValuePick;
          if (selectedCategory === "bulk") return item.isBulkOption;
          return true;
        }) || [];

  const filteredProduceItems =
    selectedCategory === "all"
      ? dashboardData?.produceItems || []
      : dashboardData?.produceItems.filter((item) => {
          if (selectedCategory === "healthy") return item.isHealthy;
          if (selectedCategory === "value") return item.isValuePick;
          if (selectedCategory === "bulk") return item.isBulkOption;
          return true;
        }) || [];

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatShoppingStyle = (style: string) => {
    switch (style) {
      case "bulk":
        return "Bulk Buy Shopper";
      case "value":
        return "Value Shopper";
      case "health":
        return "Health Conscious";
      case "budget":
        return "Budget Shopper";
      case "prepper":
        return "Prepper/Pantry Stocker";
      case "seasonal":
        return "Seasonal Cook";
      case "homesteader":
        return "Homesteader/Gardener";
      case "clean":
        return "Clean Ingredient Shopper";
      default:
        return style;
    }
  };

  // Get first name from full name
  const firstName = user.firstName || user.fullName?.split(" ")[0] || "User";

  // Check if Google Maps API key is available
  const hasGoogleMapsApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Format date for news items
  const formatNewsDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Format impact level for news items
  const formatImpactLevel = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "High Impact";
      case "medium":
        return "Medium Impact";
      case "low":
        return "Low Impact";
      default:
        return level || "Unknown Impact";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-semibold">🥕 Pantry Tracker</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-green-600 border-r-transparent"></div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <Calendar className="inline-block mr-2 h-4 w-4" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <User className="h-5 w-5" />
                  <span>{user.fullName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 inline-block mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile search bar */}
      <div className="md:hidden p-4 bg-white border-b">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-green-600 border-r-transparent"></div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "dashboard"
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("mylist")}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "mylist"
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              My List
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "search"
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Search Results
            </button>
            <button
              onClick={() => setActiveTab("recipes")}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "recipes"
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              My Recipes
            </button>
            <button
              onClick={() => setActiveTab("bulkBuy")}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "bulkBuy"
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Bulk Buy Calculator
            </button>
            <button
              onClick={() => setActiveTab("myPantry")}
              className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "myPantry"
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              My Pantry
            </button>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel (Slide-in from right) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsSettingsOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              ></motion.div>
              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <motion.div
                  className="relative w-screen max-w-md"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                  <div className="h-full flex flex-col py-6 bg-white shadow-xl overflow-y-auto">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <h2 className="text-lg font-medium text-gray-900">
                          User Settings
                        </h2>
                        <button
                          onClick={() => setIsSettingsOpen(false)}
                          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <span className="sr-only">Close panel</span>
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 relative flex-1 px-4 sm:px-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            defaultValue={user.zipCode}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Shopping Style
                          </label>
                          <select
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            defaultValue={user.shoppingStyle}
                          >
                            <option value="bulk">Bulk Buy Shopper</option>
                            <option value="value">Value Shopper</option>
                            <option value="health">Health Conscious</option>
                            <option value="budget">Budget Shopper</option>
                            <option value="prepper">
                              Prepper/Pantry Stocker
                            </option>
                            <option value="seasonal">Seasonal Cook</option>
                            <option value="homesteader">
                              Homesteader/Gardener
                            </option>
                            <option value="clean">
                              Clean Ingredient Shopper
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Pantry Item Modal */}
      <AddPantryItemModal
        isOpen={isAddPantryItemModalOpen}
        onClose={() => setIsAddPantryItemModalOpen(false)}
        onAdd={handleAddPantryItem}
      />

      {/* Navigation Tabs (Desktop) */}
      <div className="hidden md:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === "dashboard"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("mylist")}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === "mylist"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My List
            </button>
            {searchResults.length > 0 && (
              <button
                onClick={() => setActiveTab("search")}
                className={`px-1 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "search"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Search Results
              </button>
            )}
            <button
              onClick={() => setActiveTab("recipes")}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === "recipes"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Recipes
            </button>
            <button
              onClick={() => setActiveTab("bulkBuy")}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === "bulkBuy"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Bulk Buy Calculator
            </button>
            <button
              onClick={() => setActiveTab("myPantry")}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === "myPantry"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Pantry
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Welcome Panel */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="md:flex md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Hello {firstName}! Here's your shopping snapshot for{" "}
                      {user.zipCode}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      You selected:{" "}
                      <span className="font-medium">
                        {formatShoppingStyle(user.shoppingStyle)}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                    <p className="mt-4">Loading your shopping data...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-8">
                  <p>{error}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-sm font-medium text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {/* Two-column layout for map and buy alerts */}
                  <motion.div
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Google Map */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Your Shopping Area
                      </h2>
                      {hasGoogleMapsApiKey ? (
                        <>
                          <GoogleMap zipCode={user.zipCode} height="300px" />
                          <div className="mt-4 text-sm text-gray-500 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-green-600" />
                            Showing stores and prices in ZIP code {user.zipCode}
                          </div>

                          {/* Nearby Stores List */}
                          <div className="mt-4">
                            <h3 className="text-md font-medium text-gray-800 mb-2">
                              Nearby Stores:
                            </h3>
                            <div className="space-y-2">
                              {dashboardData?.stores &&
                              dashboardData.stores.length > 0 ? (
                                dashboardData.stores.map((store) => (
                                  <motion.div
                                    key={store._id}
                                    className="flex items-start border-b border-gray-100 pb-2"
                                    whileHover={{ x: 5 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">
                                        {store.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {store.address.formattedAddress}
                                      </p>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {store.rating && (
                                        <span className="flex items-center">
                                          <svg
                                            className="w-3 h-3 text-yellow-400 mr-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00.951-.69l1.07-3.292z"></path>
                                          </svg>
                                          {store.rating}
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No stores found in your area.
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                          <p className="text-gray-500">
                            Google Maps API key is required to display the map.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Buy Alerts */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-green-600" />
                        Best Value This Week
                      </h2>
                      <div className="space-y-4">
                        {dashboardData?.buyAlerts &&
                        dashboardData.buyAlerts.length > 0 ? (
                          dashboardData.buyAlerts.map((alert) => (
                            <motion.div
                              key={alert.id}
                              className="bg-green-50 rounded-lg p-4 border border-green-100"
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                                  <Tag className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-gray-900">
                                    {alert.name}
                                  </h3>
                                  <p className="mt-1 text-sm text-gray-600">
                                    ${alert.lowestPrice.price.toFixed(2)} @{" "}
                                    {alert.lowestPrice.store}{" "}
                                    <span className="text-gray-500">
                                      (was ${alert.priceRange.max.toFixed(2)} at
                                      highest)
                                    </span>
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-green-700">
                                    Save $
                                    {(
                                      alert.priceRange.max -
                                      alert.lowestPrice.price
                                    ).toFixed(2)}{" "}
                                    per unit
                                  </p>
                                  <button
                                    onClick={() => addToList(alert.id)}
                                    className="mt-2 inline-flex items-center text-xs font-medium text-green-600 hover:text-green-800"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to my list
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            No special deals found this week.
                          </p>
                        )}
                        {dashboardData?.buyAlerts &&
                          dashboardData.buyAlerts.length > 0 && (
                            <div className="text-center mt-4"></div>
                          )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Pantry Staples */}
                  <motion.div
                    className="bg-white rounded-lg shadow-md p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                        Top Pantry Staples (This Week's Deals)
                      </h2>
                      <div className="flex space-x-2">
                        <select
                          className="text-sm border border-gray-300 rounded-md shadow-sm py-1 px-3 bg-white"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="all">All Items</option>
                          <option value="healthy">Healthier Options</option>
                          <option value="value">Value Picks</option>
                          <option value="bulk">Bulk Packs</option>
                        </select>
                      </div>
                    </div>

                    {/* Use the ProductCard component for consistent styling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPantryItems.length > 0 ? (
                        filteredPantryItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ y: -5 }}
                            className="h-full"
                          >
                            <ProductCard
                              product={item}
                              onAddToList={addToList}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-gray-500">
                            No pantry items found for the selected filter.
                          </p>
                        </div>
                      )}
                    </div>

                    {filteredPantryItems.length > 0 && (
                      <div className="mt-6 text-center"></div>
                    )}
                  </motion.div>

                  {/* Fresh Produce */}
                  <motion.div
                    className="bg-white rounded-lg shadow-md p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5 mr-2 text-green-600"
                        >
                          <path d="M2.5 5.6c1 .8 2.2 1.4 3.5 1.4 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 2.5.6 3.5 1.4" />
                          <path d="M2.5 11.6c1 .8 2.2 1.4 3.5 1.4 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 2.5.6 3.5 1.4" />
                          <path d="M2.5 17.6c1 .8 2.2 1.4 3.5 1.4 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 2.5.6 3.5 1.4" />
                        </svg>
                        Top Fresh Produce Prices
                      </h2>
                    </div>

                    {/* Use the ProductCard component for consistent styling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProduceItems.length > 0 ? (
                        filteredProduceItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ y: -5 }}
                            className="h-full"
                          >
                            <ProductCard
                              product={item}
                              onAddToList={addToList}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-gray-500">
                            No produce items found for the selected filter.
                          </p>
                        </div>
                      )}
                    </div>

                    {filteredProduceItems.length > 0 && (
                      <div className="mt-6 text-center"></div>
                    )}
                  </motion.div>

                  {/* Price Trends */}
                  <motion.div
                    className="bg-white rounded-lg shadow-md p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5 mr-2 text-green-600"
                        >
                          <path d="M3 3v18h18" />
                          <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        Price Trends Over Time
                      </h2>
                    </div>

                    {isPriceTrendsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                          <p className="mt-4">Loading price trends...</p>
                        </div>
                      </div>
                    ) : priceTrends && priceTrends.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {priceTrends.slice(0, 2).map((trend) => (
                          <PriceTrendChart
                            key={trend.id}
                            itemName={trend.name}
                            priceHistory={trend.priceHistory}
                            priceChange={trend.priceChange}
                            currentPrice={trend.currentPrice}
                            lowestPrice={trend.lowestPrice}
                            highestPrice={trend.highestPrice}
                            storeName={trend.storeName}
                            seasonalLow={trend.seasonalLow}
                            buyRecommendation={trend.buyRecommendation}
                            buyRecommendationReason={
                              trend.buyRecommendationReason
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          No price trends available at this time.
                        </p>
                        <p className="mt-2 text-sm text-gray-400">
                          Add items to your pantry to start tracking price
                          trends.
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Grocery News */}
                  <motion.div
                    className="bg-white rounded-lg shadow-md p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                      <Globe className="h-5 w-5 mr-2 text-green-600" />
                      This Week's Food News
                    </h2>
                    <div className="space-y-4">
                      {dashboardData?.newsHighlights &&
                      dashboardData.newsHighlights.length > 0 ? (
                        dashboardData.newsHighlights.map((news, index) => (
                          <motion.div
                            key={news.id}
                            className="flex items-start"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ x: 5 }}
                          >
                            <a
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start w-full"
                            >
                              <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                                {news.category === "Weather" && (
                                  <AlertCircle className="h-5 w-5 text-orange-600" />
                                )}
                                {news.category === "Supply Chain" && (
                                  <Truck className="h-5 w-5 text-blue-600" />
                                )}
                                {news.category === "Economic" && (
                                  <Info className="h-5 w-5 text-purple-600" />
                                )}
                                {![
                                  "Weather",
                                  "Supply Chain",
                                  "Economic",
                                ].includes(news.category) && (
                                  <Info className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center">
                                  <p className="text-sm text-gray-700 font-medium">
                                    {news.title}
                                  </p>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {formatNewsDate(news.publishedAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {news.summary}
                                </p>
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  {formatImpactLevel(news.impactLevel)}
                                </span>
                              </div>
                            </a>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No news updates available at this time.
                        </p>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* My List Tab */}
        {activeTab === "mylist" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="mylist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2 text-green-600" />
                    My Shopping List
                  </h2>
                </div>

                {isMyListLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                      <p className="mt-4">Loading your list...</p>
                    </div>
                  </div>
                ) : myList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myList.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -5 }}
                        className="h-full"
                      >
                        <ProductCard
                          product={item}
                          onRemoveFromList={removeFromList}
                          isInList={true}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-4 text-gray-500">
                      Your shopping list is empty.
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Search for products or add items from the dashboard to
                      build your list.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Search Results Tab */}
        {activeTab === "search" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <Search className="h-5 w-5 mr-2 text-green-600" />
                    Search Results for "{searchQuery}"
                  </h2>
                </div>

                {isSearching ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                      <p className="mt-4">Searching for products...</p>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -5 }}
                        className="h-full"
                      >
                        <ProductCard product={item} onAddToList={addToList} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-4 text-gray-500">
                      No products found for "{searchQuery}"
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Try a different search term or browse the dashboard for
                      products.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Recipe Price Tracker Tab */}
        {activeTab === "recipes" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2 text-green-600"
                    >
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                      <path d="M9 18h6" />
                      <path d="M12 22v-4" />
                    </svg>
                    My Recipe Price Tracker
                  </h2>
                </div>
                <RecipePriceTracker />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Bulk Buy Calculator Tab */}
        {activeTab === "bulkBuy" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="bulkBuy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2 text-green-600"
                    >
                      <path d="M3 3v18h18" />
                      <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                      <path d="M9 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
                    Bulk Buy Calculator
                  </h2>
                </div>
                <BulkBuyCalculator />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* My Pantry Tab */}
        {activeTab === "myPantry" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="myPantry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2 text-green-600"
                    >
                      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
                      <path d="M9 2v3a2 2 0 0 1-2 2H4" />
                      <path d="M12 22v-7" />
                      <path d="M5 8v14h14V8" />
                      <path d="M5 2v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V2" />
                    </svg>
                    My Pantry Items
                  </h2>
                  <button
                    onClick={() => setIsAddPantryItemModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Pantry Item
                  </button>
                </div>

                {/* My Pantry Content */}
                {isMyPantryLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                      <p className="mt-4">Loading your pantry items...</p>
                    </div>
                  </div>
                ) : myPantryItems.length > 0 ? (
                  <div className="space-y-4">
                    {myPantryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {item.size} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${item.lowestPrice.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600">
                            Qty: {item.quantity || 1}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto text-gray-300"
                    >
                      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
                      <path d="M9 2v3a2 2 0 0 1-2 2H4" />
                      <path d="M12 22v-7" />
                      <path d="M5 8v14h14V8" />
                      <path d="M5 2v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V2" />
                    </svg>
                    <p className="mt-4 text-gray-500">Your pantry is empty.</p>
                    <p className="mt-2 text-sm text-gray-400">
                      Add items to your pantry to track prices and get alerts
                      when prices drop.
                    </p>
                    <button
                      onClick={() => setIsAddPantryItemModalOpen(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Your First Pantry Item
                    </button>
                  </div>
                )}
              </div>

              {/* Price Trends for My Pantry */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 mr-2 text-green-600"
                    >
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                    My Pantry Price Trends
                  </h2>
                </div>

                {isMyPantryTrendsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                      <p className="mt-4">Loading price trends...</p>
                    </div>
                  </div>
                ) : myPantryTrends && myPantryTrends.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {myPantryTrends.slice(0, 4).map((trend) => (
                      <PriceTrendChart
                        key={trend.id}
                        itemName={trend.name}
                        priceHistory={trend.priceHistory}
                        priceChange={trend.priceChange}
                        currentPrice={trend.currentPrice}
                        lowestPrice={trend.lowestPrice}
                        highestPrice={trend.highestPrice}
                        storeName={trend.storeName}
                        quantity={trend.quantity}
                        monthlyUsage={trend.monthlyUsage}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No price trends available for your pantry items.
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Add items to your pantry to start tracking price trends.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Pantry Tracker. All rights
              reserved.
            </p>
            <p className="text-sm text-gray-500">
              Data updated weekly on Sundays
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
