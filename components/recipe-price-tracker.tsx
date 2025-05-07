"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Edit, AlertCircle } from "lucide-react"

type Ingredient = {
  id: string
  name: string
  quantity: number
  unit: string
  currentPrice: number
  previousPrice: number | null
}

type Recipe = {
  id: string
  name: string
  ingredients: Ingredient[]
  totalCurrentPrice: number
  totalPreviousPrice: number | null
  priceChange: number | null
  lastUpdated: string
}

export default function RecipePriceTracker() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const [isAddingRecipe, setIsAddingRecipe] = useState(false)
  const [isEditingRecipe, setIsEditingRecipe] = useState<string | null>(null)

  // New recipe form state
  const [newRecipeName, setNewRecipeName] = useState("")
  const [newIngredients, setNewIngredients] = useState<Omit<Ingredient, "id" | "currentPrice" | "previousPrice">[]>([
    { name: "", quantity: 1, unit: "item" },
  ])

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch recipes")
      }

      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (err) {
      console.error("Error fetching recipes:", err)
      setError(err instanceof Error ? err.message : "Failed to load recipes")
    } finally {
      setLoading(false)
    }
  }

  const toggleRecipeExpansion = (recipeId: string) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId)
  }

  const handleAddIngredient = () => {
    setNewIngredients([...newIngredients, { name: "", quantity: 1, unit: "item" }])
  }

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = [...newIngredients]
    updatedIngredients.splice(index, 1)
    setNewIngredients(updatedIngredients)
  }

  const handleIngredientChange = (index: number, field: string, value: string | number) => {
    const updatedIngredients = [...newIngredients]
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    }
    setNewIngredients(updatedIngredients)
  }

  const handleSubmitRecipe = async () => {
    try {
      if (!newRecipeName.trim()) {
        setError("Recipe name is required")
        return
      }

      if (newIngredients.some((ing) => !ing.name.trim())) {
        setError("All ingredients must have a name")
        return
      }

      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRecipeName,
          ingredients: newIngredients,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save recipe")
      }

      // Reset form
      setNewRecipeName("")
      setNewIngredients([{ name: "", quantity: 1, unit: "item" }])
      setIsAddingRecipe(false)

      // Refresh recipes
      fetchRecipes()
    } catch (err) {
      console.error("Error saving recipe:", err)
      setError(err instanceof Error ? err.message : "Failed to save recipe")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${recipeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete recipe")
      }

      // Refresh recipes
      fetchRecipes()
    } catch (err) {
      console.error("Error deleting recipe:", err)
      setError(err instanceof Error ? err.message : "Failed to delete recipe")
    } finally {
      setLoading(false)
    }
  }

  const formatPriceChange = (change: number | null) => {
    if (change === null) return "N/A"

    const formattedChange = Math.abs(change).toFixed(1)
    if (change > 0) {
      return <span className="text-red-600">↑ {formattedChange}%</span>
    } else if (change < 0) {
      return <span className="text-green-600">↓ {formattedChange}%</span>
    } else {
      return <span className="text-gray-600">0%</span>
    }
  }

  if (loading && recipes.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4">Loading your recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {recipes.length === 0 && !isAddingRecipe ? (
        <div className="text-center py-8">
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
            className="mx-auto h-12 w-12 text-gray-300"
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M12 22v-4" />
          </svg>
          <p className="mt-4 text-gray-500">You haven't added any recipes yet.</p>
          <button
            onClick={() => setIsAddingRecipe(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Recipe
          </button>
        </div>
      ) : (
        <>
          {!isAddingRecipe && (
            <div className="mb-6">
              <button
                onClick={() => setIsAddingRecipe(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Recipe
              </button>
            </div>
          )}

          {isAddingRecipe && (
            <div className="bg-white border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-4">Add New Recipe</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700">
                    Recipe Name
                  </label>
                  <input
                    type="text"
                    id="recipeName"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="e.g., Spaghetti Bolognese"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>

                  {newIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Ingredient name"
                      />

                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(index, "quantity", Number.parseFloat(e.target.value))}
                        className="w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        min="0.1"
                        step="0.1"
                      />

                      <select
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                        className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="item">item</option>
                        <option value="lb">lb</option>
                        <option value="oz">oz</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ingredient
                  </button>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingRecipe(false)
                      setNewRecipeName("")
                      setNewIngredients([{ name: "", quantity: 1, unit: "item" }])
                      setError("")
                    }}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitRecipe}
                    disabled={loading}
                    className="inline-flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Recipe
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 bg-white cursor-pointer"
                  onClick={() => toggleRecipeExpansion(recipe.id)}
                >
                  <div>
                    <h3 className="font-medium">{recipe.name}</h3>
                    <p className="text-sm text-gray-500">
                      {recipe.ingredients.length} ingredients • Last updated:{" "}
                      {new Date(recipe.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {/* <p className="font-medium">${recipe.totalCurrentPrice.toFixed(2)}</p> */}
                      <p className="text-xs">{formatPriceChange(recipe.priceChange)} from last month</p>
                    </div>

                    {expandedRecipe === recipe.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedRecipe === recipe.id && (
                  <div className="p-4 bg-gray-50 border-t">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingredient
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Price
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recipe.ingredients.map((ingredient) => (
                          <tr key={ingredient.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ingredient.name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {ingredient.quantity} {ingredient.unit}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                              {/* ${ingredient.currentPrice.toFixed(2)} */}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                              {ingredient.previousPrice !== null ? (
                                <span
                                  className={
                                    ingredient.currentPrice > ingredient.previousPrice
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {ingredient.currentPrice > ingredient.previousPrice ? "↑" : "↓"}$
                                  {Math.abs(ingredient.currentPrice - ingredient.previousPrice).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={2} className="px-3 py-2 text-sm font-medium text-gray-900">
                            Total
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                            ${recipe.totalCurrentPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-right">
                            {recipe.totalPreviousPrice !== null ? (
                              <span
                                className={
                                  recipe.totalCurrentPrice > recipe.totalPreviousPrice
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {recipe.totalCurrentPrice > recipe.totalPreviousPrice ? "↑" : "↓"}$
                                {Math.abs(recipe.totalCurrentPrice - recipe.totalPreviousPrice).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>

                      <button
                        onClick={() => setIsEditingRecipe(recipe.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
