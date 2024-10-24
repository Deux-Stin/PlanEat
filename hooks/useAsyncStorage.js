import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const RECIPES_PATH = `${FileSystem.documentDirectory}recipes.json`;
const SHOPPING_HISTORY_PATH = `${FileSystem.documentDirectory}shoppingHistory.json`;

export const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setStoredValue(JSON.parse(value));
        } else {
          // Vérifier l'existence du fichier JSON correspondant
          const filePath = key === 'recipes' ? RECIPES_PATH : SHOPPING_HISTORY_PATH;
          const fileExists = await FileSystem.getInfoAsync(filePath);

          if (fileExists.exists) {
            await loadFromJson(filePath);
          } else {
            // Si le fichier n'existe pas, initialiser avec la valeur par défaut
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
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));

      const filePath = key === 'recipes' ? RECIPES_PATH : SHOPPING_HISTORY_PATH;
      await saveToJson(filePath, valueToStore);
      console.log('valueToStore :', valueToStore)

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
      console.log('parsedData :', parsedData)
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier ${filePath} :`, error);
    }
  };

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
