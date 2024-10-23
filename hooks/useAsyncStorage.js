import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Chemins des fichiers séparés pour les recettes et les listes de courses
const RECIPES_PATH = `${FileSystem.documentDirectory}recipes.json`;
const SHOPPING_HISTORY_PATH = `${FileSystem.documentDirectory}shoppingHistory.json`;

export const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger depuis AsyncStorage selon la clé
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setStoredValue(JSON.parse(value));
        } else {
          // Si la clé n'est pas présente dans AsyncStorage, essayer de lire depuis le fichier JSON
          if (key === 'recipes') {
            await loadFromJson(RECIPES_PATH);
          } else if (key === 'shoppingHistory') {
            await loadFromJson(SHOPPING_HISTORY_PATH);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture de la clé ${key} :`, error);
      }
    };
    loadData();
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));

      // Enregistrer dans un fichier JSON séparé selon la clé
      if (key === 'recipes') {
        await saveToJson(RECIPES_PATH, valueToStore);
      } else if (key === 'shoppingHistory') {
        await saveToJson(SHOPPING_HISTORY_PATH, valueToStore);
      }

    } catch (error) {
      console.error(`Erreur lors de l'écriture de la clé ${key} :`, error);
    }
  };

  // Charger à partir d'un fichier JSON
  const loadFromJson = async (filePath) => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const parsedData = JSON.parse(fileContent);
      setStoredValue(parsedData);
      console.log(`Données chargées depuis ${filePath}`);
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier ${filePath} :`, error);
    }
  };

  // Sauvegarder dans un fichier JSON
  const saveToJson = async (filePath, data) => {
    try {
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
      console.log(`Données sauvegardées dans ${filePath}`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans le fichier ${filePath} :`, error);
    }
  };

  return [storedValue, setValue];
};
