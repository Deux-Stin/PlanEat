import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const FILE_PATHS = {
  recipes: `${FileSystem.documentDirectory}recipes.json`,
  mealPlanHistory: `${FileSystem.documentDirectory}mealPlanHistory.json`,
  favoris: `${FileSystem.documentDirectory}favoris.json`,
  backgroundIndex: `${FileSystem.documentDirectory}backgroundIndex.json`,
};

export const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setStoredValue(JSON.parse(value));
        } else {
          const filePath = FILE_PATHS[key];
          const fileExists = await FileSystem.getInfoAsync(filePath);

          if (fileExists.exists) {
            await loadFromJson(filePath);
          } else {
            await saveToJson(filePath, initialValue);
            setStoredValue(initialValue);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture de la clé ${key} :`, error);
      }
    };
    initializeData();
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      if (valueToStore !== null && valueToStore !== undefined) {
        setStoredValue(valueToStore);

        const filePath = FILE_PATHS[key];
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        await saveToJson(filePath, valueToStore);
      } else {
        console.warn(`Tentative de sauvegarder une valeur nulle ou indéfinie pour ${key}`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'écriture de la clé ${key} :`, error);
    }
  };

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

  const getStoredValue = async () => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : initialValue;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la valeur pour ${key} :`, error);
      return initialValue;
    }
  };

  const saveToJson = async (filePath, data) => {
    try {
      if (data !== null && data !== undefined) {
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
        console.log(`Données sauvegardées dans ${filePath}`);
      } else {
        console.error(`Les données à sauvegarder sont nulles ou indéfinies et ne peuvent pas être écrites dans ${filePath}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde dans le fichier ${filePath} :`, error);
    }
  };

  return [storedValue, setValue, getStoredValue];
};
