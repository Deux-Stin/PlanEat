// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import RecipeLibrary from './screens/RecipeLibrary.js';
import AddRecipe from './screens/AddRecipe';
import RecipeDetail from './screens/RecipeDetail';
import MealPlanScreen from './screens/MealPlanScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import useInitializeRecipes from './hooks/useInitializeRecipes'; // Export par défaut

const Stack = createStackNavigator();

export default function App() {
  const loading = useInitializeRecipes(); // Initialiser les recettes au démarrage

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
