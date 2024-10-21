import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const NEW_RECIPES_PATH = `${FileSystem.documentDirectory}recipes.json`; // Chemin du fichier de débogage

  useEffect(() => {
    const loadData = async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setStoredValue(JSON.parse(value));
        }
        console.log('Passage par le useEffect de AsyncStorage');
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
      console.log('Passage par le setValue de AsyncStorage');

      // Enregistrer dans le fichier JSON
      if (Array.isArray(valueToStore)) {
        await saveRecipesToJson(valueToStore);
        console.log('Passage par le saveRecipesToJson de AsyncStorage');
      }
    } catch (error) {
      console.error(`Erreur lors de l'écriture de la clé ${key} :`, error);
    }
  };

  // Fonction pour sauvegarder les recettes dans un nouveau fichier JSON
  const saveRecipesToJson = async (recipes) => {
    try {
      await FileSystem.writeAsStringAsync(NEW_RECIPES_PATH, JSON.stringify(recipes));
      console.log('Recettes sauvegardées dans recipes.json ici :', NEW_RECIPES_PATH);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des recettes :', error);
    }
  };

  return [storedValue, setValue];
};
