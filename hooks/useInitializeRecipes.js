// hooks/useInitializeRecipes.js

import { useEffect, useState } from 'react';
import { useAsyncStorage } from './useAsyncStorage';
import * as FileSystem from 'expo-file-system';


export default function useInitializeRecipes() {
  const [storedRecipes, setStoredRecipes] = useAsyncStorage('recipes', []);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // Drapeau pour éviter de recharger

  useEffect(() => {
    const initializeRecipes = async () => {
      if (initialized || storedRecipes.length > 0) {
        // Si les recettes sont déjà présentes ou si elles ont été initialisées, on ne fait rien
        // console.log('Recettes déjà présentes ou initialisées.');
        setLoading(false);
        return;
      }
      try {
        const fileUri = `${FileSystem.documentDirectory}recipes.json`; 
        const fileExists = await FileSystem.getInfoAsync(fileUri);

        if (fileExists.exists) {
          // Charger les recettes depuis le fichier JSON
          const fileContent = await FileSystem.readAsStringAsync(fileUri);
          const recipesData = JSON.parse(fileContent);
          
          // Enregistrer les recettes dans AsyncStorage
          await setStoredRecipes(recipesData);
          console.log('Recettes chargées depuis recipes.json.');
        } else {
          console.log('Le fichier recipes.json n\'existe pas. Utilisation de recettes par défaut.');
        }

        setInitialized(true); // Marquer comme initialisé après la première lecture
      } catch (error) {
        console.error('Erreur lors du chargement des recettes :', error);
      }
      setLoading(false);
    };

    initializeRecipes();
  }, [initialized, storedRecipes, setStoredRecipes]);

  return loading;
}