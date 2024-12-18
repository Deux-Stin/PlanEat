// App.js

import React, { useEffect, useState, useRef  } from 'react';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, Dimensions, View, StyleSheet, PermissionsAndroid, Platform, StatusBar } from 'react-native';
import { globalStyles } from './globalStyles';
import LottieView from 'lottie-react-native';

import HomeScreen from './screens/HomeScreen';
import RecipeLibrary from './screens/RecipeLibrary';
import AddRecipe from './screens/AddRecipe';
import RecipeDetail from './screens/RecipeDetail';
import MealPlanScreen from './screens/MealPlanScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import useInitializeRecipes from './hooks/useInitializeRecipes';
import SeasonalCalendarScreen from './screens/SeasonalCalendarScreen';
import MealPlanSummaryScreen from './screens/MealPlanSummaryScreen';
import RecipeSelectionScreen from './screens/RecipeSelectionScreen';
import MealAssignmentScreen from './screens/MealAssignmentScreen';
import { MealPlanProvider } from './screens/MealPlanContext';

const Stack = createStackNavigator();

const { width, height } = Dimensions.get('window');

export default function App() {

  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const [resourcesReady, setResourcesReady] = useState(false);
  const [animationCount, setAnimationCount] = useState(0);
  const animationRef = useRef(null);

  const [fontsLoaded] = useFonts({
    POLYA: require('./assets/fonts/POLYA/POLYA.otf'),
    rubik_moonrocks : require('./assets/fonts/rubik-moonrocks/RubikMoonrocks-Regular.ttf'),
    rubik_microbe : require('./assets/fonts/rubik-microbe/Rubik-Microbe-Regular.ttf'),
    jurassic_park: require('./assets/fonts/jurassic-park/Jurassic_Park.ttf'),
    montserrat_armenian: require('./assets/fonts/montserrat-armenian/Montserratarm-ExtraLight.otf'),
    montserrat_alternates: require('./assets/fonts/montserrat-alternates/MontserratAlternates-Regular.ttf'),
  });

  // Initialiser les recettes au démarrage
  const loading = useInitializeRecipes(); 

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

  // Déclenche la mise à jour de l'état quand les ressources sont prêtes
  useEffect(() => {
    if (fontsLoaded && !loading) {
      setResourcesReady(true);
    }
  }, [fontsLoaded, loading]);

  // Fonction appelée quand l'animation se termine
  const handleAnimationFinish = () => {
    if (animationCount < 1) {
      setAnimationCount(animationCount + 1);
      animationRef.current?.play(); // Redémarre l'animation si elle n'est pas terminée
    } else if (resourcesReady) {
      setIsAnimationDone(true); // Passe à l'écran principal quand tout est prêt
    }
  };

  // Affiche l'écran de chargement si les ressources ou l'animation ne sont pas prêtes
  if (!isAnimationDone) {
    return (
      <View style={styles.splashContainer}>
        <LottieView
          ref={animationRef}
          source={require('./assets/images/monkey_animation_lottie_light.json')}
          autoPlay
          loop={false}
          speed={1}
          onAnimationFinish={handleAnimationFinish}
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <MealPlanProvider>
      {/* Gestion globale de la barre de statut */}
      <StatusBar
        // barStyle="default" // Couleur du texte (icônes et heure)
        // backgroundColor="transparent" // Arrière-plan transparent
        translucent={false} // Permet au contenu de passer sous la barre
      />

      <NavigationContainer>
        <Stack.Navigator initialRouteName="HomeScreen">
          {/* Page d'accueil */}
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />

          {/* Bibliothèque de recettes */}
          <Stack.Screen
            name="RecipeLibrary"
            component={RecipeLibrary}
            options={{ title: "Bibliothèque de recettes" }}
          />

          {/* Ajouter une recette */}
          <Stack.Screen name="AddRecipe" component={AddRecipe} options={{ title: "Ajouter une Recette" }} />

          {/* Détails de la recette */}
          <Stack.Screen name="RecipeDetail" component={RecipeDetail} options={{ title: "Détails de la Recette" }} />

          {/* Ecran de sélection des recettes */}
          <Stack.Screen
            name="RecipeSelectionScreen"
            component={RecipeSelectionScreen}
            options={{ title: "Faites vos choix" }}
          />

          {/* Attribution après le choix des recettes */}
          <Stack.Screen
            name="MealAssignmentScreen"
            component={MealAssignmentScreen}
            options={{ title: "Attribuer vos recettes" }}
          />

          {/* Calendrier de saison */}
          <Stack.Screen
            name="SeasonalCalendarScreen"
            component={SeasonalCalendarScreen}
            options={({ navigation }) => ({
              title: "Calendrier des saisons",
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
          <Stack.Screen name="MealPlanScreen" component={MealPlanScreen} options={{ title: "Planification" }} />

          {/* Page de résumé des menus attribués selon la date */}
          <Stack.Screen
            name="MealPlanSummaryScreen"
            component={MealPlanSummaryScreen}
            options={{
              title: "Résumé de vos choix",
              headerShown: true,
            }}
          />

          {/* Liste de courses */}
          <Stack.Screen
            name="ShoppingListScreen"
            component={ShoppingListScreen}
            options={{ title: "Liste de courses", headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </MealPlanProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  lottie: {
    width: width * 1.1,
    height: width * 1.0,
    paddingRight: width * 0.1
  },
});