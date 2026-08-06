"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Droplets, Apple, Sparkles, Trash2, Coffee, Sun, 
  Utensils, Cookie, ArrowLeft, Heart, Search, BookOpen, 
  Dumbbell, CheckSquare, Smile, Calendar, Award, AlertCircle
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AppLogo } from "@/components/ui/app-logo";
import { CuteSonaMonaNote } from "@/components/ui/cute-sona-mona-note";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import axios from "axios";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LoggedMeal {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function NutritionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const userId = user?.id || "d3b07384-d113-4ec6-a558-7e3077dd7d7b";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);


  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [water, setWater] = useState<number>(0); // in ml
  const [activeTab, setActiveTab] = useState<"tracker" | "diet_plan" | "database" | "guide">("tracker");

  // Form states
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [calories, setCalories] = useState<number>(300);
  const [protein, setProtein] = useState<number>(15);
  const [carbs, setCarbs] = useState<number>(30);
  const [fat, setFat] = useState<number>(8);

  const [showAddForm, setShowAddForm] = useState(false);
  
  // Grocery list state
  const [checkedGroceries, setCheckedGroceries] = useState<Record<string, boolean>>({});

  // Targets
  const CALORIE_TARGET = 1800;
  const PROTEIN_TARGET = 90; // g (PC&D target: 1.2-1.6g per kg)
  const CARBS_TARGET = 180; // g
  const FAT_TARGET = 50; // g
  const WATER_TARGET = 2000; // ml

  // Load from database (and fallback to localStorage)
  const fetchNutritionLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/nutrition?user_id=${userId}`);
      if (response.data && Array.isArray(response.data)) {
        // Filter logs only for TODAY
        const todayLogs = response.data.filter((log: any) => {
          const logDate = new Date(log.logged_at);
          const today = new Date();
          return logDate.getDate() === today.getDate() &&
                 logDate.getMonth() === today.getMonth() &&
                 logDate.getFullYear() === today.getFullYear();
        });

        // Parse meals
        const dbMeals = todayLogs
          .filter((log: any) => log.meal_type !== "water")
          .map((log: any) => ({
            id: log.id,
            type: log.meal_type,
            name: log.food_name || "Custom Meal",
            calories: log.calories || 0,
            protein: log.protein || 0,
            carbs: log.carbs || 0,
            fat: log.fat || 0,
          }));

        // Compute water
        const dbWater = todayLogs
          .filter((log: any) => log.meal_type === "water")
          .reduce((sum: number, log: any) => sum + (log.water_amount || 0), 0);

        setMeals(dbMeals);
        setWater(dbWater);

        localStorage.setItem("careloop_meals", JSON.stringify(dbMeals));
        localStorage.setItem("careloop_water", dbWater.toString());
      }
    } catch (err) {
      console.warn("Backend API not reachable. Loading from localStorage cache.");
      const savedMeals = localStorage.getItem("careloop_meals");
      const savedWater = localStorage.getItem("careloop_water");
      if (savedMeals) setMeals(JSON.parse(savedMeals));
      if (savedWater) setWater(Number(savedWater));
    }
  };

  useEffect(() => {
    const savedGroceries = localStorage.getItem("careloop_groceries");
    if (savedGroceries) setCheckedGroceries(JSON.parse(savedGroceries));

    if (userId) {
      fetchNutritionLogs();
    }
  }, [userId]);

  const saveMealsToLocal = (newMeals: LoggedMeal[]) => {
    setMeals(newMeals);
    localStorage.setItem("careloop_meals", JSON.stringify(newMeals));
  };

  const saveWaterToLocal = (newWater: number) => {
    setWater(newWater);
    localStorage.setItem("careloop_water", newWater.toString());
  };

  const toggleGrocery = (item: string) => {
    const next = { ...checkedGroceries, [item]: !checkedGroceries[item] };
    setCheckedGroceries(next);
    localStorage.setItem("careloop_groceries", JSON.stringify(next));
  };

  // Add water
  const handleAddWater = async (amount: number) => {
    const nextWater = Math.min(water + amount, WATER_TARGET * 1.5);
    saveWaterToLocal(nextWater);

    if (water < WATER_TARGET && nextWater >= WATER_TARGET) {
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#9B86FA", "#67E8A5", "#FF7597"],
      });
    } else {
      confetti({
        particleCount: 15,
        spread: 30,
        origin: { y: 0.8 },
        colors: ["#9B86FA", "#FF7597"],
      });
    }

    // Sync water log to backend database
    try {
      await axios.post(`${API_BASE_URL}/api/nutrition?user_id=${userId}`, {
        meal_type: "water",
        food_name: "Water",
        calories: 0.0,
        protein: 0.0,
        carbs: 0.0,
        fat: 0.0,
        water_amount: amount
      });
    } catch (err) {
      console.warn("Could not save water to backend database.");
    }
  };

  // Add custom meal log
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const tempId = "temp-" + Date.now();
    const newMeal: LoggedMeal = {
      id: tempId,
      type: mealType,
      name: mealName.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    };

    const updated = [newMeal, ...meals];
    saveMealsToLocal(updated);
    
    // Clear inputs
    setMealName("");
    setCalories(300);
    setProtein(15);
    setCarbs(30);
    setFat(8);
    setShowAddForm(false);

    confetti({
      particleCount: 40,
      spread: 45,
      colors: ["#FF7597", "#9B86FA"],
    });

    // Save to backend database
    try {
      const response = await axios.post(`${API_BASE_URL}/api/nutrition?user_id=${userId}`, {
        meal_type: mealType,
        food_name: newMeal.name,
        calories: newMeal.calories,
        protein: newMeal.protein,
        carbs: newMeal.carbs,
        fat: newMeal.fat,
        water_amount: 0.0
      });
      if (response.data && response.data.id) {
        // Swap temp ID for DB ID
        setMeals(prev => prev.map(m => m.id === tempId ? { ...m, id: response.data.id } : m));
      }
    } catch (err) {
      console.warn("Could not save custom meal to backend database.");
    }
  };

  // Quick Pre-fill / Log suggestion
  const handleSelectFood = (food: { name: string; calories: number; protein: number; carbs: number; fat: number }) => {
    setActiveTab("tracker");
    setMealName(food.name);
    setCalories(food.calories);
    setProtein(food.protein);
    setCarbs(food.carbs);
    setFat(food.fat);
    setShowAddForm(true);
    confetti({
      particleCount: 10,
      colors: ["#FF7597", "#67E8A5"],
    });
  };

  const handleDeleteMeal = async (id: string) => {
    const filtered = meals.filter((meal) => meal.id !== id);
    saveMealsToLocal(filtered);

    // Resilient delete from database
    if (!id.startsWith("temp-")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/nutrition/${id}`);
      } catch (err) {
        console.warn("Could not delete custom meal from backend database.");
      }
    }
  };


  // 7-day Diet plan toggles
  const [dietType, setDietType] = useState<"veg" | "non-veg">("veg");
  const [activeDay, setActiveDay] = useState<number>(0); // 0 = Mon, 6 = Sun

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // PCOD Indian Food Database (Per 100g)
  const [dbSearch, setDbSearch] = useState("");
  const foodDatabase = [
    // Section A: Protein Rich
    { name: "Soy chunks", category: "Protein", calories: 345, protein: 52, carbs: 33, fat: 0.5, fibre: 13, rating: "Excellent" },
    { name: "Soybeans", category: "Protein", calories: 446, protein: 36, carbs: 30, fat: 20, fibre: 9, rating: "Excellent" },
    { name: "Moong Dal", category: "Protein", calories: 347, protein: 24, carbs: 63, fat: 1.2, fibre: 16, rating: "Excellent" },
    { name: "Masoor Dal", category: "Protein", calories: 352, protein: 25, carbs: 60, fat: 0.7, fibre: 11, rating: "Excellent" },
    { name: "Toor Dal", category: "Protein", calories: 343, protein: 22, carbs: 63, fat: 1.5, fibre: 15, rating: "Excellent" },
    { name: "Paneer", category: "Protein", calories: 265, protein: 18, carbs: 6, fat: 20, fibre: 0, rating: "Good" },
    { name: "Tofu", category: "Protein", calories: 76, protein: 8, carbs: 2, fat: 4.8, fibre: 1, rating: "Excellent" },
    { name: "Greek Yogurt", category: "Protein", calories: 59, protein: 10, carbs: 3.5, fat: 0.4, fibre: 0, rating: "Excellent" },
    { name: "Curd (Whole Milk)", category: "Protein", calories: 61, protein: 3.5, carbs: 4.7, fat: 3, fibre: 0, rating: "Good" },
    { name: "Whole Egg", category: "Protein", calories: 143, protein: 13, carbs: 1, fat: 10, fibre: 0, rating: "Excellent" },
    { name: "Chicken Breast", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, fibre: 0, rating: "Excellent" },
    { name: "Rohu Fish", category: "Protein", calories: 97, protein: 20, carbs: 0, fat: 2, fibre: 0, rating: "Excellent" },
    { name: "Prawns", category: "Protein", calories: 99, protein: 24, carbs: 0, fat: 0.3, fibre: 0, rating: "Excellent" },
    { name: "Mutton (Lean Cut)", category: "Protein", calories: 294, protein: 25, carbs: 0, fat: 21, fibre: 0, rating: "Limit portion" },
    
    // Section B: High Fibre & Seeds
    { name: "Flax Seeds", category: "Fibre & Fats", calories: 534, protein: 18, carbs: 29, fat: 42, fibre: 27, rating: "Excellent" },
    { name: "Chia Seeds", category: "Fibre & Fats", calories: 486, protein: 17, carbs: 42, fat: 31, fibre: 34, rating: "Excellent" },
    { name: "Pumpkin Seeds", category: "Fibre & Fats", calories: 559, protein: 30, carbs: 10, fat: 49, fibre: 6, rating: "Excellent" },
    { name: "Almonds", category: "Fibre & Fats", calories: 579, protein: 21, carbs: 22, fat: 50, fibre: 12, rating: "Excellent" },
    { name: "Walnuts", category: "Fibre & Fats", calories: 654, protein: 15, carbs: 14, fat: 65, fibre: 7, rating: "Excellent" },
    { name: "Oats", category: "Grains", calories: 389, protein: 17, carbs: 66, fat: 7, fibre: 10, rating: "Excellent" },
    { name: "Ragi (Finger Millet)", category: "Grains", calories: 336, protein: 7, carbs: 72, fat: 1.3, fibre: 11, rating: "Excellent" },
    { name: "Jowar (Sorghum)", category: "Grains", calories: 329, protein: 10, carbs: 72, fat: 3.4, fibre: 9, rating: "Excellent" },
    { name: "Bajra (Pearl Millet)", category: "Grains", calories: 361, protein: 11, carbs: 67, fat: 5, fibre: 11, rating: "Excellent" },
    
    // Section C: Fruits & Vegetables
    { name: "Spinach (Palak)", category: "Vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fibre: 2.2, rating: "Excellent" },
    { name: "Broccoli", category: "Vegetables", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fibre: 2.6, rating: "Excellent" },
    { name: "Cucumber", category: "Vegetables", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fibre: 0.5, rating: "Excellent" },
    { name: "Apple", category: "Fruits", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, fibre: 2.4, rating: "Excellent" },
    { name: "Guava", category: "Fruits", calories: 68, carbs: 14, protein: 2.6, fat: 1, fibre: 5.4, rating: "Excellent" },
    { name: "Papaya", category: "Fruits", calories: 43, carbs: 11, protein: 0.5, fat: 0.3, fibre: 1.7, rating: "Excellent" },
    { name: "Mango", category: "Fruits", calories: 60, carbs: 15, protein: 0.8, fat: 0.4, fibre: 1.6, rating: "Limit portion" },
    { name: "Litchi", category: "Fruits", calories: 66, carbs: 16, protein: 0.8, fat: 0.4, fibre: 1.3, rating: "Limit portion" },
    { name: "Jackfruit (Ripe)", category: "Fruits", calories: 95, carbs: 23, protein: 1.7, fat: 0.6, fibre: 1.5, rating: "Limit portion" },
    { name: "Raw Jackfruit (Kathal)", category: "Vegetables", calories: 75, carbs: 15, protein: 2, fat: 0.3, fibre: 6, rating: "Excellent" }
  ];

  // Filtered Food Database
  const filteredDb = foodDatabase.filter(food => 
    food.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
    food.category.toLowerCase().includes(dbSearch.toLowerCase())
  );

  // Vegetarian 7-Day Plan
  const vegDietPlan = [
    {
      morning: "Lemon warm water + 5 soaked almonds + 1 tsp flax seeds",
      breakfast: "Moong Dal Chilla (with vegetables) + 1 cup Curd",
      breakfastMacros: { name: "Moong Dal Chilla & Curd", calories: 350, protein: 18, carbs: 45, fat: 8 },
      snack: "1 Guava or Apple + 2 Walnuts",
      lunch: "2 Roti + 1 bowl Dal + Bhindi Sabzi + Cucumber Salad + 1 cup Curd",
      lunchMacros: { name: "Roti, Dal & Bhindi Plate", calories: 480, protein: 20, carbs: 70, fat: 12 },
      evening: "Roasted Chana + 1 cup unsweetened Green Tea",
      dinner: "Paneer & Vegetable Stir Fry (150g paneer) + Spinach salad",
      dinnerMacros: { name: "Paneer Stir Fry Salad", calories: 420, protein: 25, carbs: 12, fat: 26 }
    },
    {
      morning: "Jeera water + 5 soaked almonds + 1 tsp pumpkin seeds",
      breakfast: "Vegetable Oats (with peas, carrots) + flax seed garnish",
      breakfastMacros: { name: "Vegetable Seeds Oats", calories: 310, protein: 10, carbs: 48, fat: 6 },
      snack: "Papaya bowl (150g) + 3 almonds",
      lunch: "1 cup Brown Rice + 1 bowl Rajma + Mixed salad + 1 cup Curd",
      lunchMacros: { name: "Brown Rice, Rajma & Curd", calories: 510, protein: 22, carbs: 80, fat: 9 },
      evening: "Roasted Makhana + Green tea",
      dinner: "Tofu curry + 1 Jowar Roti + stir-fry vegetables",
      dinnerMacros: { name: "Tofu Curry & Jowar Roti", calories: 380, protein: 19, carbs: 45, fat: 11 }
    },
    {
      morning: "Warm water + 5 almonds + 1 tsp chia seeds",
      breakfast: "Besan Chilla (paneer stuffed) + Mint chutney",
      breakfastMacros: { name: "Besan Paneer Chilla", calories: 390, protein: 21, carbs: 38, fat: 14 },
      snack: "1 Orange or Kiwi",
      lunch: "2 Jowar Roti + 1 bowl Toor Dal + Cabbage sabzi + Carrot Salad",
      lunchMacros: { name: "Jowar Roti, Dal & Cabbage", calories: 460, protein: 18, carbs: 68, fat: 10 },
      evening: "Moong sprouts chaat (with tomato, onion, lemon)",
      dinner: "Paneer Tikka (grilled) + Broccoli & Capsicum Salad",
      dinnerMacros: { name: "Grilled Paneer Tikka", calories: 430, protein: 24, carbs: 10, fat: 28 }
    },
    {
      morning: "Warm water + 5 soaked almonds + 1 tsp flax seeds",
      breakfast: "Veg Poha (with peanuts & peas) + 1 cup Greek Yogurt",
      breakfastMacros: { name: "Veg Poha & Greek Yogurt", calories: 360, protein: 16, carbs: 50, fat: 9 },
      snack: "1 Pear or Guava",
      lunch: "2 Bajra Roti + Mixed Vegetable Sabzi + Chickpea Dal",
      lunchMacros: { name: "Bajra Roti & Chickpeas", calories: 490, protein: 19, carbs: 72, fat: 11 },
      evening: "Almonds + Herbal tea",
      dinner: "Moong dal khichdi (1 cup) + Curd + Beetroot salad",
      dinnerMacros: { name: "Moong Dal Khichdi", calories: 370, protein: 14, carbs: 62, fat: 7 }
    },
    {
      morning: "Warm water + 5 soaked almonds",
      breakfast: "Ragi Dosa (2 small) + Sambhar (with drumstick/pumpkin)",
      breakfastMacros: { name: "Ragi Dosa & Sambhar", calories: 320, protein: 11, carbs: 55, fat: 5 },
      snack: "Apple slices + 1 tsp peanut butter",
      lunch: "2 Wheat Roti + 1 bowl Chole + Spinach salad + Buttermilk",
      lunchMacros: { name: "Roti, Chole & Buttermilk", calories: 470, protein: 20, carbs: 72, fat: 10 },
      evening: "Roasted peanuts (handful) + Green tea",
      dinner: "Paneer Bhurji (150g) + Capsicum & Tomato Stir-fry",
      dinnerMacros: { name: "Paneer Bhurji Plate", calories: 410, protein: 23, carbs: 9, fat: 28 }
    },
    {
      morning: "Lemon water + 5 soaked almonds + 1 tsp flax seeds",
      breakfast: "Sprouts Salad Bowl (with pomegranate) + Curd",
      breakfastMacros: { name: "Sprouts Bowl & Curd", calories: 290, protein: 15, carbs: 38, fat: 5 },
      snack: "Pomegranate seeds (1 cup)",
      lunch: "1 cup Millet Khichdi + vegetables + Curd + salad",
      lunchMacros: { name: "Millet Veg Khichdi", calories: 390, protein: 13, carbs: 64, fat: 8 },
      evening: "Roasted Makhana",
      dinner: "Tofu / Paneer salad (with olive oil, seeds and greens)",
      dinnerMacros: { name: "Tofu Paneer Seeds Salad", calories: 380, protein: 22, carbs: 11, fat: 25 }
    },
    {
      morning: "Warm water + 5 almonds + 1 tsp chia seeds",
      breakfast: "Vegetable Upma (with sprouts & peanut toppings)",
      breakfastMacros: { name: "Veg Upma & Sprouts", calories: 330, protein: 12, carbs: 50, fat: 7 },
      snack: "Kiwi or Orange",
      lunch: "2 Roti + 1 bowl Moong Dal + Bottle Gourd (Dudhi) + Salad",
      lunchMacros: { name: "Roti, Dal & Dudhi Plate", calories: 430, protein: 17, carbs: 65, fat: 9 },
      evening: "Walnut halves + Green tea",
      dinner: "Vegetable hot soup + Grilled Tofu cubes + Mixed green salad",
      dinnerMacros: { name: "Tofu Soup & Green Salad", calories: 280, protein: 16, carbs: 18, fat: 12 }
    }
  ];

  // Non-Vegetarian 7-Day Plan
  const nonVegDietPlan = [
    {
      morning: "Lemon warm water + 5 soaked almonds + 1 tsp flax seeds",
      breakfast: "2 Boiled Eggs + 1 slice Whole Wheat Toast + Spinach stir-fry",
      breakfastMacros: { name: "Boiled Eggs & Toast", calories: 280, protein: 18, carbs: 15, fat: 13 },
      snack: "5-6 pieces of Litchi (Limited) 🌸",
      lunch: "Chicken Curry (150g) + 2 Rotis + Cucumber Tomato Salad",
      lunchMacros: { name: "Chicken Curry & Roti", calories: 510, protein: 35, carbs: 42, fat: 18 },
      evening: "Roasted Makhana + Green tea",
      dinner: "Grilled Rohu Fish (150g) + Steamed Broccoli & Carrot",
      dinnerMacros: { name: "Grilled Fish & Broccoli", calories: 260, protein: 32, carbs: 10, fat: 8 }
    },
    {
      morning: "Jeera water + 5 soaked almonds + 1 tsp pumpkin seeds",
      breakfast: "2 Egg Omelette (with onions, spinach) + 1 cup cooked Oats",
      breakfastMacros: { name: "Omelette & Oats Bowl", calories: 360, protein: 21, carbs: 32, fat: 15 },
      snack: "1/2 Mango slices (Limited portion) 🥭",
      lunch: "Fish Curry (150g Rohu) + 1 cup Brown Rice + Lettuce Salad",
      lunchMacros: { name: "Fish Curry & Brown Rice", calories: 440, protein: 28, carbs: 55, fat: 12 },
      evening: "Greek Yogurt (1 cup) + Chia seeds",
      dinner: "Chicken Clear Soup (with shredded breast, cabbage, beans)",
      dinnerMacros: { name: "Shredded Chicken Soup", calories: 240, protein: 28, carbs: 12, fat: 6 }
    },
    {
      morning: "Warm water + 5 almonds + 1 tsp chia seeds",
      breakfast: "Egg Bhurji (2 eggs) + 1 Roti + Mint chutney",
      breakfastMacros: { name: "Egg Bhurji & Roti", calories: 340, protein: 19, carbs: 28, fat: 14 },
      snack: "Orange slices",
      lunch: "Grilled Chicken Tikka (150g) + Onion Cucumber salad + 1 Roti",
      lunchMacros: { name: "Chicken Tikka & Salad", calories: 430, protein: 38, carbs: 25, fat: 16 },
      evening: "Sprouts chaat + Green tea",
      dinner: "Pan-seared Fish fillet + stir-fry Bhindi & Capsicum",
      dinnerMacros: { name: "Seared Fish & Bhindi", calories: 290, protein: 30, carbs: 12, fat: 11 }
    },
    {
      morning: "Warm water + 5 soaked almonds + 1 tsp flax seeds",
      breakfast: "2 Boiled Eggs + 1 bowl Moong Sprouts (steamed)",
      breakfastMacros: { name: "Boiled Eggs & Sprouts", calories: 290, protein: 21, carbs: 18, fat: 12 },
      snack: "Raw Jackfruit Curry (Kathal) 🍲",
      lunch: "Chicken Curry (150g) + 1 Bajra Roti + Salad + Curd",
      lunchMacros: { name: "Chicken, Bajra & Curd", calories: 490, protein: 37, carbs: 38, fat: 17 },
      evening: "Roasted Chana + Green tea",
      dinner: "Egg Salad (2 eggs, lettuce, cucumber, lemon, flax seeds)",
      dinnerMacros: { name: "Flax Egg Salad", calories: 270, protein: 17, carbs: 8, fat: 16 }
    },
    {
      morning: "Warm water + 5 soaked almonds",
      breakfast: "2 Egg Omelette (mushrooms & tomatoes) + Buttermilk",
      breakfastMacros: { name: "Mushroom Omelette & Milk", calories: 280, protein: 18, carbs: 6, fat: 18 },
      snack: "5-6 pieces of Litchi (Limited) 🌸",
      lunch: "Fish Curry + 1 cup Brown Rice + Spinach Salad",
      lunchMacros: { name: "Fish Curry & Brown Rice", calories: 430, protein: 27, carbs: 54, fat: 12 },
      evening: "Almonds & Walnuts (handful)",
      dinner: "Chicken Breast cubes stir-fry (with broccoli, beans, carrots)",
      dinnerMacros: { name: "Chicken Breast Veg Stir-fry", calories: 320, protein: 36, carbs: 10, fat: 9 }
    },
    {
      morning: "Lemon water + 5 soaked almonds + 1 tsp flax seeds",
      breakfast: "Egg Sandwich (2 egg whites, whole wheat bread, cucumber)",
      breakfastMacros: { name: "Egg White Sandwich", calories: 250, protein: 16, carbs: 24, fat: 4 },
      snack: "1/2 cup Ripe Jackfruit slices (Limited) 🥭",
      lunch: "Grilled Chicken Breast (150g) + Greek Salad + Buttermilk",
      lunchMacros: { name: "Grilled Chicken & Greek Salad", calories: 390, protein: 38, carbs: 12, fat: 14 },
      evening: "Roasted Makhana",
      dinner: "Grilled Rohu Fish + Stir-fry ridge gourd (Turai) + Curd",
      dinnerMacros: { name: "Grilled Fish & Turai Sabzi", calories: 310, protein: 28, carbs: 15, fat: 11 }
    },
    {
      morning: "Warm water + 5 almonds + 1 tsp chia seeds",
      breakfast: "Scrambled Eggs (2 eggs) + 1 cup cooked Oats (with seeds)",
      breakfastMacros: { name: "Scrambled Eggs & Oats", calories: 350, protein: 20, carbs: 32, fat: 14 },
      snack: "1/2 Mango slices (Limited portion) 🥭",
      lunch: "Chicken Curry + 1 Roti + Beetroot salad + Curd",
      lunchMacros: { name: "Chicken Curry, Roti & Curd", calories: 490, protein: 36, carbs: 38, fat: 16 },
      evening: "Walnuts & Green tea",
      dinner: "High protein seafood salad (prawns, lettuce, cucumber, seeds)",
      dinnerMacros: { name: "Protein Prawns Salad", calories: 290, protein: 30, carbs: 10, fat: 10 }
    }
  ];

  // Helper to log all meals for a diet plan day
  const handleLogDayDiet = async () => {
    const currentPlan = dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay];
    
    // Log the 3 core meals
    const loggedMeals: LoggedMeal[] = [
      {
        id: (Date.now() + 1).toString(),
        type: "breakfast",
        name: currentPlan.breakfast,
        calories: currentPlan.breakfastMacros.calories,
        protein: currentPlan.breakfastMacros.protein,
        carbs: currentPlan.breakfastMacros.carbs,
        fat: currentPlan.breakfastMacros.fat
      },
      {
        id: (Date.now() + 2).toString(),
        type: "lunch",
        name: currentPlan.lunch,
        calories: currentPlan.lunchMacros.calories,
        protein: currentPlan.lunchMacros.protein,
        carbs: currentPlan.lunchMacros.carbs,
        fat: currentPlan.lunchMacros.fat
      },
      {
        id: (Date.now() + 3).toString(),
        type: "dinner",
        name: currentPlan.dinner,
        calories: currentPlan.dinnerMacros.calories,
        protein: currentPlan.dinnerMacros.protein,
        carbs: currentPlan.dinnerMacros.carbs,
        fat: currentPlan.dinnerMacros.fat
      }
    ];

    const updated = [...loggedMeals, ...meals];
    saveMealsToLocal(updated);

    confetti({
      particleCount: 100,
      spread: 70,
      colors: ["#67E8A5", "#9B86FA", "#FF7597"],
    });

    setActiveTab("tracker");

    // Sync all 3 meals to backend database
    for (const meal of loggedMeals) {
      try {
        await axios.post(`${API_BASE_URL}/api/nutrition?user_id=${userId}`, {
          meal_type: meal.type,
          food_name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          water_amount: 0.0
        });
      } catch (err) {
        console.warn("Could not save daily diet plan meals to backend database.");
      }
    }
  };


  // Totals calculations
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  const caloriePercent = Math.min(Math.round((totalCalories / CALORIE_TARGET) * 100), 100);
  const waterPercent = Math.min(Math.round((water / WATER_TARGET) * 100), 100);

  const typeIcons = {
    breakfast: <Coffee className="text-[#FF7597]" size={16} />,
    lunch: <Sun className="text-[#FFD075]" size={16} />,
    dinner: <Utensils className="text-[#9B86FA]" size={16} />,
    snack: <Cookie className="text-[#67E8A5]" size={16} />,
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col gap-6 select-none">
      
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-[#A19AA8] hover:text-[#FF7597] transition-colors font-medium self-start sm:self-auto"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <Link href="/reels" className="text-[#A19AA8] hover:text-[#9B86FA] transition-colors">
            Yoga & Reels 🧘‍♀️
          </Link>
          <div className="flex items-center gap-1.5 text-white">
            <AppLogo size="sm" />
            <span className="font-outfit font-extrabold">CareLoop Bloom for Sona</span>
          </div>
        </div>
      </div>

      {/* Hero Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-outfit text-white flex items-center gap-2 flex-wrap">
            PCOD Nutrition & Diet Tracker 🍓
          </h1>
          <p className="text-xs sm:text-sm text-[#A19AA8] font-inter mt-1">
            Carefully curated Indian recipes, seeds cycle tracking, and healthy tips for Sona.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setActiveTab("tracker");
              setShowAddForm(!showAddForm);
            }}
            className="flex-1 md:flex-none py-3 px-5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#FF7597] to-[#9B86FA] hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 shadow-md cute-shadow-pink cursor-pointer"
          >
            <Plus size={16} />
            {showAddForm && activeTab === "tracker" ? "Close Form" : "Log a Custom Meal"}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "tracker" ? "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
          }`}
        >
          📈 Macro Tracker
        </button>
        <button
          onClick={() => setActiveTab("diet_plan")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "diet_plan" ? "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
          }`}
        >
          📅 PCOD 7-Day Plan
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "database" ? "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
          }`}
        >
          🔍 Food Database
        </button>
        <button
          onClick={() => setActiveTab("guide")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "guide" ? "bg-gradient-to-r from-[#FF7597] to-[#9B86FA] text-white" : "text-[#A19AA8] hover:text-white"
          }`}
        >
          🧘 PCOD Plate & Gym
        </button>
      </div>

      {/* TAB 1: Macro Tracker & Custom Logging */}
      {activeTab === "tracker" && (
        <div className="flex flex-col gap-6">
          
          {/* Quick Add Meal Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <GlassCard glowColor="purple" hoverEffect={false} className="mb-6">
                  <form onSubmit={handleAddMeal} className="flex flex-col gap-5">
                    <h3 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
                      <Apple size={18} className="text-[#FF7597] animate-bounce" /> Log a Meal or Snack
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#A19AA8] font-bold font-inter">What did you eat?</label>
                        <input
                          type="text"
                          placeholder="e.g. Soy chunks curry"
                          value={mealName}
                          onChange={(e) => setMealName(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#9B86FA] transition-colors"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#A19AA8] font-bold font-inter">Meal Type</label>
                        <select
                          value={mealType}
                          onChange={(e: any) => setMealType(e.target.value)}
                          className="bg-[#14121F] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F3F1F6] focus:outline-none focus:border-[#9B86FA] transition-colors"
                        >
                          <option value="breakfast">Breakfast ☕</option>
                          <option value="lunch">Lunch ☀️</option>
                          <option value="dinner">Dinner 🍽️</option>
                          <option value="snack">Snack 🍪</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#A19AA8] font-bold font-inter">Calories (kcal)</label>
                        <input
                          type="number"
                          value={calories}
                          onChange={(e) => setCalories(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#9B86FA]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#A19AA8] font-bold font-inter">Protein (g)</label>
                        <input
                          type="number"
                          value={protein}
                          onChange={(e) => setProtein(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#A19AA8] font-bold font-inter">Carbs (g)</label>
                        <input
                          type="number"
                          value={carbs}
                          onChange={(e) => setCarbs(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#A19AA8] font-bold font-inter">Fats (g)</label>
                        <input
                          type="number"
                          value={fat}
                          onChange={(e) => setFat(Number(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="py-3 px-6 mt-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B86FA] to-[#67E8A5] hover:opacity-95 transition-opacity cursor-pointer shadow-md cute-shadow-purple"
                    >
                      Save Log
                    </button>
                  </form>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid: Macro summaries & Hydration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Macro Summary Card */}
            <GlassCard glowColor="pink" className="md:col-span-2 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold font-outfit text-base sm:text-lg text-white">Daily PCOD Macro Targets</h3>
                <span className="text-xs text-[#A19AA8] bg-white/5 px-2.5 py-1 rounded-full font-semibold">
                  {totalCalories} / {CALORIE_TARGET} kcal
                </span>
              </div>

              {/* Calories bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-[#A19AA8] font-inter">
                  <span>Calories (Goal: 1800 kcal)</span>
                  <span>{caloriePercent}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#FF7597] to-[#9B86FA]"
                    initial={{ width: 0 }}
                    animate={{ width: `${caloriePercent}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Core Macros row */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#A19AA8] font-inter">Protein (PC Target)</span>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#FF7597]" animate={{ width: `${Math.min((totalProtein / PROTEIN_TARGET) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-white font-medium mt-1 font-outfit">
                    {totalProtein}g / {PROTEIN_TARGET}g
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#A19AA8] font-inter">Carbs (Complex)</span>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#FFD075]" animate={{ width: `${Math.min((totalCarbs / CARBS_TARGET) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-white font-medium mt-1 font-outfit">
                    {totalCarbs}g / {CARBS_TARGET}g
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#A19AA8] font-inter">Healthy Fats</span>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#67E8A5]" animate={{ width: `${Math.min((totalFat / FAT_TARGET) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-white font-medium mt-1 font-outfit">
                    {totalFat}g / {FAT_TARGET}g
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Hydration Card */}
            <GlassCard glowColor="purple" className="flex flex-col justify-between gap-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold font-outfit text-base sm:text-lg text-white">Water Balance</h3>
                  <p className="text-xs text-[#A19AA8] mt-0.5">Maintain hydration level</p>
                </div>
                <Droplets className="text-[#9B86FA] animate-bounce" size={20} />
              </div>

              {/* Fluid Animation Cup */}
              <div className="flex flex-col items-center justify-center my-1 relative">
                <div className="w-18 h-26 border-3 border-white/20 rounded-b-2xl relative overflow-hidden bg-white/5 flex items-end">
                  <motion.div
                    className="w-full bg-gradient-to-t from-[#9B86FA] to-[#67E8A5]/70"
                    animate={{ height: `${waterPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-outfit font-extrabold text-xs text-white drop-shadow-md">
                    {water} ml
                  </div>
                </div>
                <span className="text-xs text-[#A19AA8] mt-3 font-semibold">
                  Target: {WATER_TARGET} ml
                </span>
              </div>

              {/* Water buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddWater(250)}
                  className="py-2 rounded-xl text-xs font-bold text-[#9B86FA] border border-[#9B86FA]/30 hover:bg-[#9B86FA]/10 transition-colors cursor-pointer"
                >
                  +250 ml 💧
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="py-2 rounded-xl text-xs font-bold text-white bg-[#9B86FA] hover:opacity-90 transition-opacity cursor-pointer shadow-md cute-shadow-purple"
                >
                  +500 ml 🥤
                </button>
              </div>
            </GlassCard>

          </div>

          {/* Logged Meal History */}
          <GlassCard glowColor="none" className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold font-outfit text-base sm:text-lg text-white">Sona's Meals Today</h3>
              <button
                onClick={() => saveMealsToLocal([])}
                className="text-xs text-[#FF7597]/70 hover:text-[#FF7597] transition-colors font-medium cursor-pointer"
              >
                Clear Logs
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {meals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#A19AA8] text-sm gap-2">
                  <span>🍃</span>
                  <span>No meals logged for today yet. Make sure to nourish yourself!</span>
                </div>
              ) : (
                <AnimatePresence>
                  {meals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex justify-between items-center p-4 rounded-2xl bg-white/3 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                          {typeIcons[meal.type]}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white font-outfit">{meal.name}</h4>
                          <div className="flex gap-2 text-[10px] text-[#A19AA8] font-inter mt-0.5 flex-wrap">
                            <span className="capitalize font-bold text-[#9B86FA]">{meal.type}</span>
                            <span>•</span>
                            <span>{meal.calories} kcal</span>
                            <span>•</span>
                            <span>P: {meal.protein}g</span>
                            <span>•</span>
                            <span>C: {meal.carbs}g</span>
                            <span>•</span>
                            <span>F: {meal.fat}g</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="p-2 text-[#A19AA8] hover:text-[#FF7597] transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </GlassCard>

        </div>
      )}

      {/* TAB 2: Interactive 7-Day PCOD Diet Planner */}
      {activeTab === "diet_plan" && (
        <div className="flex flex-col gap-6">
          
          {/* Planner Controls: Veg / Non-Veg toggles */}
          <div className="flex justify-between items-center flex-wrap gap-4 bg-white/3 p-4 rounded-3xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍱</span>
              <div>
                <h3 className="font-bold text-white font-outfit text-sm sm:text-base">7-Day Healthy PCOD Planner</h3>
                <p className="text-[10px] text-[#A19AA8]">High protein, low insulin spike templates</p>
              </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl gap-1">
              <button
                onClick={() => setDietType("veg")}
                className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  dietType === "veg" ? "bg-[#67E8A5] text-[#0B0A0F]" : "text-[#A19AA8] hover:text-white"
                }`}
              >
                Vegetarian Plan 🌱
              </button>
              <button
                onClick={() => setDietType("non-veg")}
                className={`py-1.5 px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  dietType === "non-veg" ? "bg-[#FF7597] text-white" : "text-[#A19AA8] hover:text-white"
                }`}
              >
                Non-Vegetarian 🍗
              </button>
            </div>
          </div>

          {/* Calendar week layout selection */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {daysOfWeek.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`py-3 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeDay === idx 
                    ? "bg-gradient-to-br from-[#FF7597]/20 to-[#9B86FA]/20 border-[#FF7597] text-white font-bold" 
                    : "bg-white/3 border-white/5 text-[#A19AA8] hover:border-white/10"
                }`}
              >
                <span className="text-[10px] font-semibold font-inter uppercase tracking-wider">{day.substring(0, 3)}</span>
                <span className="text-sm font-outfit">Day {idx + 1}</span>
              </button>
            ))}
          </div>

          {/* Detailed day details card */}
          <GlassCard glowColor="pink" className="flex flex-col gap-6">
            <div className="flex justify-between items-start border-b border-white/5 pb-4 flex-wrap gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#FF7597] font-inter">
                  Target Plan for {daysOfWeek[activeDay]}
                </span>
                <h3 className="text-xl font-bold font-outfit text-white mt-0.5">
                  {dietType === "veg" ? "🌱 Vegetarian Meal Map" : "🍗 High Protein Non-Veg Map"}
                </h3>
              </div>

              {/* Log entire day helper */}
              <button
                onClick={handleLogDayDiet}
                className="py-2.5 px-5 rounded-xl text-xs font-bold text-[#FF7597] bg-[#FF7597]/10 border border-[#FF7597]/20 hover:bg-[#FF7597]/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar size={13} />
                Log All Day Meals
              </button>
            </div>

            {/* Meals breakdown list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Morning & Snacks */}
              <div className="flex flex-col gap-4">
                
                {/* Early Morning */}
                <div className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-400/10 text-orange-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    🌅
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-outfit">Early Morning (6–7 AM)</h4>
                    <p className="text-xs text-[#A19AA8] mt-1 leading-relaxed">
                      {(dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).morning}
                    </p>
                  </div>
                </div>

                {/* Mid-Morning Snack */}
                <div className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    🍎
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-outfit">Mid-Morning Snack (11 AM)</h4>
                    <p className="text-xs text-[#A19AA8] mt-1 pr-2 leading-relaxed">
                      {(dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).snack}
                    </p>
                  </div>
                </div>

                {/* Evening Snack */}
                <div className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-400/10 text-green-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    🍪
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-outfit">Evening Snack (5 PM)</h4>
                    <p className="text-xs text-[#A19AA8] mt-1 leading-relaxed">
                      {(dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).evening}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Major Meals (Log-able) */}
              <div className="flex flex-col gap-4">
                
                {/* Breakfast */}
                <div className="p-4 bg-[#FF7597]/5 border border-[#FF7597]/15 rounded-2xl flex justify-between items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white font-outfit flex items-center gap-1.5">
                      <Coffee size={13} className="text-[#FF7597]" /> Breakfast (8–9 AM)
                    </h4>
                    <p className="text-xs text-[#A19AA8] mt-1 pr-4 leading-relaxed font-semibold">
                      {(dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).breakfast}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectFood((dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).breakfastMacros)}
                    className="py-1.5 px-3 bg-[#FF7597]/10 text-[#FF7597] text-[10px] rounded-lg font-bold hover:bg-[#FF7597]/20 transition-all shrink-0 cursor-pointer"
                  >
                    Log
                  </button>
                </div>

                {/* Lunch */}
                <div className="p-4 bg-[#FFD075]/5 border border-[#FFD075]/15 rounded-2xl flex justify-between items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white font-outfit flex items-center gap-1.5">
                      <Sun size={13} className="text-[#FFD075]" /> Lunch (1:30 PM)
                    </h4>
                    <p className="text-xs text-[#A19AA8] mt-1 pr-4 leading-relaxed font-semibold">
                      {(dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).lunch}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectFood((dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).lunchMacros)}
                    className="py-1.5 px-3 bg-[#FFD075]/10 text-[#FFD075] text-[10px] rounded-lg font-bold hover:bg-[#FFD075]/20 transition-all shrink-0 cursor-pointer"
                  >
                    Log
                  </button>
                </div>

                {/* Dinner */}
                <div className="p-4 bg-[#9B86FA]/5 border border-[#9B86FA]/15 rounded-2xl flex justify-between items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white font-outfit flex items-center gap-1.5">
                      <Utensils size={13} className="text-[#9B86FA]" /> Dinner (8:00 PM)
                    </h4>
                    <p className="text-xs text-[#A19AA8] mt-1 pr-4 leading-relaxed font-semibold">
                      {(dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).dinner}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectFood((dietType === "veg" ? vegDietPlan[activeDay] : nonVegDietPlan[activeDay]).dinnerMacros)}
                    className="py-1.5 px-3 bg-[#9B86FA]/10 text-[#9B86FA] text-[10px] rounded-lg font-bold hover:bg-[#9B86FA]/20 transition-all shrink-0 cursor-pointer"
                  >
                    Log
                  </button>
                </div>

              </div>

            </div>
          </GlassCard>

        </div>
      )}

      {/* TAB 3: Searchable PCOD Indian Food Database */}
      {activeTab === "database" && (
        <div className="flex flex-col gap-6">
          
          {/* Database search bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 text-[#A19AA8]" size={16} />
            <input
              type="text"
              placeholder="Search protein foods, seeds, grains, fruits... (e.g. Soy chunks, Mango, Litchi, Mutton)"
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              className="w-full bg-white/3 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF7597] transition-all"
            />
          </div>

          {/* Database Results list */}
          <GlassCard glowColor="none" className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-bold font-outfit text-base text-white">Indian Food Nutrient Table (Per 100g)</h3>
              <span className="text-[10px] text-[#A19AA8] uppercase font-semibold">
                Showing {filteredDb.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDb.map((food, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col justify-between gap-3 hover:border-[#FF7597]/25 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#9B86FA]">
                        {food.category}
                      </span>
                      <h4 className="font-bold text-white font-outfit text-sm mt-0.5">
                        {food.name}
                      </h4>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      {food.rating === "Excellent" && (
                        <span className="text-[9px] bg-[#67E8A5]/10 text-[#67E8A5] border border-[#67E8A5]/25 px-2 py-0.5 rounded-full font-bold">
                          Excellent
                        </span>
                      )}
                      {food.rating === "Good" && (
                        <span className="text-[9px] bg-[#FFD075]/10 text-[#FFD075] border border-[#FFD075]/25 px-2 py-0.5 rounded-full font-bold">
                          Good
                        </span>
                      )}
                      {food.rating === "Limit portion" && (
                        <span className="text-[9px] bg-[#FF7597]/10 text-[#FF7597] border border-[#FF7597]/25 px-2 py-0.5 rounded-full font-bold">
                          ⚠️ Limit Portion
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 bg-white/2 p-2 rounded-xl border border-white/5 text-center text-[10px] text-[#A19AA8]">
                    <div>
                      <span className="block font-bold text-white text-xs">{food.calories}</span>
                      <span>kcal</span>
                    </div>
                    <div>
                      <span className="block font-bold text-[#FF7597] text-xs">{food.protein}g</span>
                      <span>Protein</span>
                    </div>
                    <div>
                      <span className="block font-bold text-[#FFD075] text-xs">{food.carbs}g</span>
                      <span>Carbs</span>
                    </div>
                    <div>
                      <span className="block font-bold text-[#67E8A5] text-xs">{food.fat}g</span>
                      <span>Fat</span>
                    </div>
                  </div>

                  {/* Log button */}
                  <button
                    onClick={() => handleSelectFood({
                      name: `${food.name} (100g)`,
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fat: food.fat
                    })}
                    className="w-full py-2 rounded-xl text-[10px] font-bold text-white bg-white/5 hover:bg-[#FF7597] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} /> Pre-fill to Tracker
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      )}

      {/* TAB 4: PCOD Plate & Gym Workout Guide + Sona's Favorites Section */}
      {activeTab === "guide" && (
        <div className="flex flex-col gap-6">

          {/* Sona's Favorites & PCOD Advisory Section */}
          <GlassCard glowColor="pink" className="flex flex-col gap-4 border border-[#FF7597]/25">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <span className="text-lg">💖</span>
              <div>
                <h3 className="font-bold text-white font-outfit text-base">Sona's Favorites PCOD Advisory</h3>
                <p className="text-[10px] text-[#A19AA8]">Tailored dietary advice for Sona's preferred fruits and meats</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Meats advice */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit flex items-center gap-1.5">
                  🍖 Meats (Mutton & Chicken)
                </h4>

                <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Chicken Breast (Lean Protein)</span>
                    <span className="text-[9px] bg-[#67E8A5]/10 text-[#67E8A5] border border-[#67E8A5]/20 px-2 py-0.5 rounded font-bold uppercase">
                      Excellent (Eat) ✅
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A19AA8] leading-relaxed">
                    <strong>Macros (100g):</strong> 165 kcal • 31g Protein • 3.6g Fat • 0g Carbs. <br />
                    <strong>PCOD Benefit:</strong> Outstanding lean protein. Boosts metabolism, supports muscle, and maintains insulin sensitivity. Enjoy grilled or steamed.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/2 border border-[#FF7597]/20 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Mutton (Red Meat)</span>
                    <span className="text-[9px] bg-[#FF7597]/15 text-[#FF7597] border border-[#FF7597]/20 px-2 py-0.5 rounded font-bold uppercase">
                      Limit Portion ⚠️
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A19AA8] leading-relaxed">
                    <strong>Macros (100g):</strong> 294 kcal • 25g Protein • 21g Fat • 0g Carbs. <br />
                    <strong>PCOD Advice:</strong> Red meat is high in saturated fats which can trigger inflammation and worsen insulin resistance. Avoid oily gravies. Limit to lean mutton cuts once a week.
                  </p>
                </div>
              </div>

              {/* Fruits advice */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit flex items-center gap-1.5">
                  🥭 Fruits (Mango, Litchi, Jackfruit)
                </h4>

                <div className="p-3 rounded-2xl bg-white/2 border border-[#FFD075]/20 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Litchi & Mango</span>
                    <span className="text-[9px] bg-[#FFD075]/15 text-[#FFD075] border border-[#FFD075]/20 px-2 py-0.5 rounded font-bold uppercase">
                      Control Portions ⚠️
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A19AA8] leading-relaxed">
                    <strong>Litchi (100g):</strong> 66 kcal, 16g carbs • <strong>Mango (100g):</strong> 60 kcal, 15g carbs. <br />
                    <strong>PCOD Advice:</strong> Both are high in natural sugars (fructose) and can cause rapid insulin spikes. Enjoy in moderation: limit litchi to 5-6 pieces and mango to half a fruit per day. Pair them with almonds or walnuts to slow down sugar absorption!
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/2 border border-[#67E8A5]/20 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Jackfruit (Ripe vs Raw)</span>
                    <span className="text-[9px] bg-[#67E8A5]/10 text-[#67E8A5] border border-[#67E8A5]/20 px-2 py-0.5 rounded font-bold uppercase">
                      Raw is Best 🌱
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A19AA8] leading-relaxed">
                    <strong>Ripe Jackfruit (100g):</strong> 95 kcal, 23g Carbs (Limit portions due to high sugar). <br />
                    <strong>Raw Jackfruit (100g):</strong> 75 kcal, 15g Carbs, 6g Fibre. <br />
                    <strong>PCOD Benefit:</strong> Raw green jackfruit (Kathal) is low-GI and incredibly high in soluble fibre, making it an excellent vegetable curry choice for glucose control!
                  </p>
                </div>
              </div>

            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Plate Layout Card */}
            <GlassCard glowColor="pink" className="flex flex-col gap-5">
              <h3 className="font-bold font-outfit text-base sm:text-lg text-white flex items-center gap-1.5">
                <Award size={18} className="text-[#FF7597]" /> PCOD Plate Method (50-25-25)
              </h3>
              
              {/* SVG Visual Circle */}
              <div className="flex justify-center items-center py-4">
                <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                  {/* 50% Salad/Vegetables */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="transparent"
                    stroke="#67E8A5"
                    strokeWidth="20"
                    strokeDasharray="440"
                    strokeDashoffset="220"
                  />
                  {/* 25% Protein */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="transparent"
                    stroke="#FF7597"
                    strokeWidth="20"
                    strokeDasharray="440"
                    strokeDashoffset="330"
                    className="origin-center rotate-180"
                  />
                  {/* 25% Complex Carbs */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="transparent"
                    stroke="#FFD075"
                    strokeWidth="20"
                    strokeDasharray="440"
                    strokeDashoffset="330"
                    className="origin-center rotate-90"
                  />
                </svg>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-[#67E8A5]" />
                  <span className="font-bold text-white w-20">50% Veggies</span>
                  <span className="text-[#A19AA8]">Spinach, Cucumber, Broccoli, Bhindi</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-[#FF7597]" />
                  <span className="font-bold text-white w-20">25% Protein</span>
                  <span className="text-[#A19AA8]">Paneer, Dal, Eggs, Soy chunks, Tofu</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-[#FFD075]" />
                  <span className="font-bold text-white w-20">25% Carbs</span>
                  <span className="text-[#A19AA8]">Roti, Brown Rice, Millets, Dalia</span>
                </div>
              </div>
            </GlassCard>

            {/* Exercises & Yoga Poses */}
            <GlassCard glowColor="purple" className="flex flex-col gap-5">
              <h3 className="font-bold font-outfit text-base sm:text-lg text-white flex items-center gap-1.5">
                <Dumbbell size={18} className="text-[#9B86FA]" /> Workout Plan for PCOD
              </h3>

              <div className="flex flex-col gap-3.5">
                <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-white font-outfit flex justify-between">
                    <span>🏋️ Strength Training (3-5 days/week)</span>
                    <span className="text-[#9B86FA]">Metabolism</span>
                  </h4>
                  <p className="text-[11px] text-[#A19AA8] mt-1">
                    Squats, lunges, push-ups. Helps build lean muscles and improves insulin reception.
                  </p>
                </div>

                <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold text-white font-outfit flex justify-between">
                    <span>🚶 Cardio Walking (Daily)</span>
                    <span className="text-[#FF7597]">30–45 mins</span>
                  </h4>
                  <p className="text-[11px] text-[#A19AA8] mt-1">
                    Steady brisk walking. Improves hormone balance and relieves high cortisol stress levels.
                  </p>
                </div>

                <div className="p-3 bg-[#9B86FA]/5 border border-[#9B86FA]/15 rounded-xl">
                  <h4 className="text-xs font-bold text-white font-outfit flex justify-between">
                    <span>🧘 Yoga for Pelvic Stimulation</span>
                    <span className="text-[#67E8A5]">Relaxing</span>
                  </h4>
                  <div className="text-[10px] text-[#A19AA8] mt-2 space-y-1">
                    <p>🦋 <strong>Butterfly Pose (Baddha Konasana):</strong> Stimulates pelvis area.</p>
                    <p>🐍 <strong>Cobra Pose (Bhujangasana):</strong> Enhances flexibility.</p>
                    <p>👶 <strong>Child Pose (Balasana):</strong> Releases stress and lowers anxiety.</p>
                  </div>
                </div>
              </div>
            </GlassCard>

          </div>

          {/* PCOD Grocery Shopping Checklist */}
          <GlassCard glowColor="none" className="flex flex-col gap-4">
            <h3 className="font-bold font-outfit text-base text-white flex items-center gap-1.5">
              <CheckSquare size={18} className="text-[#67E8A5]" /> PCOD-Friendly Grocery Checklist
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#FF7597] font-outfit mb-2">🥕 Vegetables</h4>
                <div className="flex flex-col gap-2">
                  {["Spinach", "Broccoli", "Cabbage", "Bhindi"].map(item => (
                    <label key={item} className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!checkedGroceries[item]} 
                        onChange={() => toggleGrocery(item)}
                        className="rounded border-white/20 bg-white/5 text-[#FF7597]"
                      />
                      <span className={checkedGroceries[item] ? "line-through text-[#A19AA8]" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#9B86FA] font-outfit mb-2">🥗 Proteins</h4>
                <div className="flex flex-col gap-2">
                  {["Moong Dal", "Paneer", "Tofu", "Eggs"].map(item => (
                    <label key={item} className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!checkedGroceries[item]} 
                        onChange={() => toggleGrocery(item)}
                      />
                      <span className={checkedGroceries[item] ? "line-through text-[#A19AA8]" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#FFD075] font-outfit mb-2">🌾 Healthy Grains</h4>
                <div className="flex flex-col gap-2">
                  {["Oats", "Ragi", "Jowar", "Bajra"].map(item => (
                    <label key={item} className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!checkedGroceries[item]} 
                        onChange={() => toggleGrocery(item)}
                      />
                      <span className={checkedGroceries[item] ? "line-through text-[#A19AA8]" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#67E8A5] font-outfit mb-2">🥜 Seeds & Nuts</h4>
                <div className="flex flex-col gap-2">
                  {["Flax Seeds", "Chia Seeds", "Almonds", "Walnuts"].map(item => (
                    <label key={item} className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!checkedGroceries[item]} 
                        onChange={() => toggleGrocery(item)}
                      />
                      <span className={checkedGroceries[item] ? "line-through text-[#A19AA8]" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

        </div>
      )}

      {/* Cute Personal Note for Sona-Mona */}
      <CuteSonaMonaNote />

      {/* Bottom encouraging footer quote */}
      <div className="text-center py-4 text-xs text-[#A19AA8] flex items-center justify-center gap-1.5 font-outfit">
        <Heart size={12} className="text-[#FF7597] fill-[#FF7597] animate-pulse" /> Keep blooming, Sona! You are doing amazing!
      </div>

    </div>
  );
}
