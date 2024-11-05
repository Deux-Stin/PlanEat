// App.js

import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity  } from 'react-native';
import { globalStyles } from './globalStyles';
// import AppLoading from 'expo-app-loading'; // Utilisez cette ligne si vous avez encore besoin de l'écran de chargement
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

import HomeScreen from './screens/HomeScreen';
import RecipeLibrary from './screens/RecipeLibrary';
import AddRecipe from './screens/AddRecipe';
import RecipeDetail from './screens/RecipeDetail';
import MealPlanScreen from './screens/MealPlanScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import useInitializeRecipes from './hooks/useInitializeRecipes'; // Export par défaut
import SeasonalCalendarScreen from './screens/SeasonalCalendarScreen';

const Stack = createStackNavigator();

export default function App() {

  const [fontsLoaded] = useFonts({
    POLYA: require('./assets/fonts/POLYA/POLYA.otf'),
    rubik_moonrocks : require('./assets/fonts/rubik-moonrocks/RubikMoonrocks-Regular.ttf'),
    rubik_microbe : require('./assets/fonts/rubik-microbe/Rubik-Microbe-Regular.ttf'),
    jurassic_park: require('./assets/fonts/jurassic-park/Jurassic_Park.ttf'),
    montserrat_armenian: require('./assets/fonts/montserrat-armenian/Montserratarm-ExtraLight.otf'),
    montserrat_alternates: require('./assets/fonts/montserrat-alternates/MontserratAlternates-Regular.ttf'),
  });

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

  // Attendre le changement des polices
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

    // Afficher un écran de chargement si les polices ou les données sont encore en cours de chargement
    if (!fontsLoaded || loading) {
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
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/> 


        {/* Bibliothèque de recettes */}
        <Stack.Screen name="RecipeLibrary" component={RecipeLibrary} options={{ title: 'Bibliothèque de recettes' }} />

        {/* Ajouter une recette */}
        <Stack.Screen name="AddRecipe" component={AddRecipe} options={{ title: 'Ajouter une Recette' }} />

        {/* Détails de la recette */}
        <Stack.Screen name="RecipeDetail" component={RecipeDetail} options={{ title: 'Détails de la Recette' }} />

        {/* Calendrier de saison */}
        <Stack.Screen 
          name="SeasonalCalendarScreen" 
          component={SeasonalCalendarScreen} 
          options={({ navigation }) => ({
            title: 'Calendrier des saisons',
            headerShown: true,
            // headerLeft: () => (
            //   <Button onPress={() => navigation.goBack()} title="Retour" />
            // ),
            // headerRight: () => (
            //   <TouchableOpacity
            //     style={styles.favorisButton}
            //     onPress={() => setShowOnlyFavoris(prev => !prev)}
            //   >
            //     <Text style={styles.favorisButtonText}>
            //       {showOnlyFavoris ? 'Réinitialiser' : 'Afficher les favoris'}
            //     </Text>
            //   </TouchableOpacity>
            // ),
          })}
        />

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