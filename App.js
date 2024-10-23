// App.js

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, PermissionsAndroid, Platform  } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import RecipeLibrary from './screens/RecipeLibrary';
import AddRecipe from './screens/AddRecipe';
import RecipeDetail from './screens/RecipeDetail';
import MealPlanScreen from './screens/MealPlanScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import useInitializeRecipes from './hooks/useInitializeRecipes'; // Export par défaut

const Stack = createStackNavigator();

export default function App() {

  // Gestion des autorisations android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permission d\'accès au stockage',
          message: 'Cette application a besoin d\'accéder au stockage pour enregistrer des fichiers.',
          buttonNeutral: 'Plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Vous avez accès au stockage');
        // Appeler ici la fonction pour enregistrer le fichier si nécessaire
      } else {
        console.log('Permission refusée');
      }
    }
  };

  useEffect(() => {
    requestStoragePermission();
  }, []);


  // Initialiser les recettes au démarrage
  const loading = useInitializeRecipes(); 

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Page d'accueil */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Bibliothèque de recettes */}
        <Stack.Screen name="RecipeLibrary" component={RecipeLibrary} options={{ title: 'Bibliothèque de recettes' }} />

        {/* Ajouter une recette */}
        <Stack.Screen name="AddRecipe" component={AddRecipe} options={{ title: 'Ajouter une Recette' }} />

        {/* Détails de la recette */}
        <Stack.Screen name="RecipeDetail" component={RecipeDetail} options={{ title: 'Détails de la Recette' }} />

        {/* Planifier les repas */}
        <Stack.Screen name="MealPlanScreen" component={MealPlanScreen} options={{ title: 'Planifier vos repas' }} />

        {/* Liste de courses */}
        <Stack.Screen name="ShoppingListScreen" component={ShoppingListScreen} options={{ title: 'Liste de courses' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});