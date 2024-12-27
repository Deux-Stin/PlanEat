// hooks/useInitializeRecipes.js

import { useEffect, useState } from "react";
import { useAsyncStorage } from "./useAsyncStorage";
import * as FileSystem from "expo-file-system";
import recipes from "../assets/data/recipes_base.json";

export default function useInitializeRecipes() {
  const [storedRecipes, setStoredRecipes] = useAsyncStorage("recipes", []);
  const [mealChoice, setMealChoice] = useAsyncStorage("mealChoice", []);
  const [mealPlanFromAssignation, setMealPlanFromAssignation] = useAsyncStorage("mealPlanFromAssignation", {});
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // Drapeau pour éviter de recharger

  useEffect(() => {
    const initializeRecipes = async () => {
      if (initialized || storedRecipes.length > 0) {
          setLoading(false);
          return;
      }
  
      try {
          const fileUri = `${FileSystem.documentDirectory}recipes.json`;
          const fileExists = await FileSystem.getInfoAsync(fileUri);
  
          let recipesArray;
  
          if (!fileExists.exists) {
              recipesArray = recipes.recipes || recipes; // Supporte les deux formats
          } else {
              const fileContent = await FileSystem.readAsStringAsync(fileUri);
              const recipesData = JSON.parse(fileContent);
              recipesArray = recipesData.recipes || recipesData; // Supporte les deux formats
          }
  
          if (Array.isArray(recipesArray)) {
              await setStoredRecipes(recipesArray);
          } else {
              console.error("Format des recettes incorrect :", recipesArray);
              await setStoredRecipes([]);
          }
          setMealChoice([]);
          setMealPlanFromAssignation({});
      } catch (error) {
          console.error("Erreur lors de l'initialisation des recettes :", error);
      } finally {
          setInitialized(true);
          setLoading(false);
      }
  };
  

    initializeRecipes();
  }, [initialized, setStoredRecipes]);

  return loading;
}