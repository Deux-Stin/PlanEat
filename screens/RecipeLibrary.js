import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
// import { RNFS } from 'react-native-fs';
import uuid from 'react-native-uuid';

// console.log('RNFS.ExternalStorageDirectoryPath', RNFS.ExternalStorageDirectoryPath)
// console.log('RNFS.ExternalDirectoryPath', RNFS.ExternalDirectoryPath)
// console.log('RNFS.DocumentDirectoryPath',RNFS.DocumentDirectoryPath)

export default function RecipeLibrary({ navigation, route }) {
  const [recipes, setRecipes] = useAsyncStorage('recipes', []);
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  console.log(recipes)

  const addRecipe = (newRecipe) => {
    console.log('addRecipe');
    setRecipes((prevRecipes) => {
      const updatedRecipes = [...prevRecipes, newRecipe];
      saveRecipes(updatedRecipes); // Appelez saveRecipes avec les recettes mises à jour
      return updatedRecipes; // Retournez le nouvel état
    });
  };
  
  const deleteRecipe = (recipeToDelete) => {
    console.log('deleteRecipe');
    const updatedRecipes = recipes ? recipes.filter(recipe => recipe.id !== recipeToDelete.id) : [];
    saveRecipes(updatedRecipes); // Mettez à jour les recettes
  };

  // Fonction pour sauvegarder les recettes dans le fichier
  const saveRecipes = async (newRecipes) => {
    if (newRecipes && Array.isArray(newRecipes)) {
      try {
        setRecipes(newRecipes);
        console.log('Recettes sauvegardées.');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des recettes :', error);
      }
    } else {
      console.error('Tentative de sauvegarde d\'un tableau invalide.', newRecipes);
    }
  };

 // Vérifier si une mise à jour est nécessaire
 useEffect(() => {
    if (route.params?.refresh) {
    }
  }, [route.params]);

  const importRecipesFromJson = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri } = result.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(uri);
        const newRecipes = JSON.parse(fileContent);
  
        // Traitement des recettes
        const updatedRecipes = [...recipes];  // Copie des recettes actuelles
  
        let nbNewRecipes = 0;
        newRecipes.forEach(newRecipe => {
          const existingRecipe = updatedRecipes.find(r => r.id === newRecipe.id || r.name === newRecipe.name);
  
          if (!existingRecipe) {
            // Cas où la recette est nouvelle et unique, ajout direct
            newRecipe.id = uuid.v4();
            updatedRecipes.push(newRecipe);
            nbNewRecipes++;
          } else if (existingRecipe.id !== newRecipe.id && existingRecipe.name === newRecipe.name) {
            // Cas où le nom est identique mais les ids sont différents, on ignore
            console.log(`Recette "${newRecipe.name}" ignorée car le nom est déjà présent.`);
          } else if (existingRecipe.id === newRecipe.id && existingRecipe.name !== newRecipe.name) {
            // Cas où l'id est identique mais le nom diffère, générer un nouvel id
            newRecipe.id = uuid.v4();
            updatedRecipes.push(newRecipe);
            nbNewRecipes++;
          }
        });
  
        setRecipes(updatedRecipes);  // Sauvegarder les recettes mises à jour
        console.log('Recettes mises à jour avec succès, ', nbNewRecipes,' nouvelle(s) ont été ajoutée(s).');
      } else {
        console.log('Aucun fichier sélectionné ou processus annulé.');
      }
    } catch (err) {
      console.error('Erreur lors de l\'importation du fichier :', err);
    }
  };

  console.log(recipes)

  const exportRecipes = async () => {
    try {

      // Sanitize the recipes to avoid circular references
      const sanitizedRecipes = recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        type: recipe.type,
        season: recipe.season,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        recipe: recipe.recipe, // Assurez-vous d'inclure uniquement les propriétés nécessaires
        nutritionalValues: recipe.nutritionalValues,
        // Ne pas inclure d'autres propriétés qui peuvent causer des références circulaires
      }));

      // console.log('sanitizedRecipes : ',sanitizedRecipes)

      // Convertir les recettes en JSON
      const jsonRecipes = JSON.stringify(sanitizedRecipes, null, 2);
  
      // Demander la permission d'accès au stockage
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "Veuillez autoriser l'accès au stockage.");
        return;
      }
  
      // Afficher un menu pour choisir entre partage ou sauvegarde
      Alert.alert(
        "Exporter les recettes",
        "Que souhaitez-vous faire ?",
        [
          { text: "Partager", onPress: async () => await shareRecipes(jsonRecipes) },
          { text: "Enregistrer dans un répertoire", onPress: async () => await saveRecipesToCustomDirectory(jsonRecipes) },
          { text: "Annuler", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'exportation des recettes :', error);
    }
  };
  
  const shareRecipes = async (jsonRecipes) => {
    try {
      // Créer un fichier temporaire
      const filePath = `${FileSystem.cacheDirectory}recipes.json`;
      await FileSystem.writeAsStringAsync(filePath, jsonRecipes);
  
      // Partager le fichier
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Erreur lors du partage des recettes :', error);
    }
  };
  
  const saveRecipesToCustomDirectory = async (jsonRecipes) => {
    try {
      // Demander à l'utilisateur de choisir un répertoire
      const directoryPath = await selectDirectory();

      if (directoryPath) {
        // Utiliser un champ de texte ou un modal pour le nom du fichier
        const fileName = 'recipes'; // Remplacez par votre méthode d'obtention du nom de fichier

        if (!fileName) {
          Alert.alert('Nom de fichier requis', 'Veuillez entrer un nom de fichier valide.');
          return;
        }

        const filePath = `${directoryPath}/${fileName}.json`;
        await FileSystem.writeAsStringAsync(filePath, jsonRecipes);
        Alert.alert('Fichier sauvegardé', `Recettes enregistrées dans : ${filePath}`);
      } else {
        Alert.alert('Sélection annulée', 'Aucun répertoire n\'a été sélectionné.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des recettes :', error);
    }
  };

  const selectDirectory = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
        multiple: false,
      });

      if (result.type === 'success') {
        return result.uri.substring(0, result.uri.lastIndexOf('/'));
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du répertoire :', error);
    }
    return null;
  };

  const categories = ['Petit-déjeuner', 'Déjeuner', 'Dîner'];

  const toggleCategory = (category) => {
    setExpandedCategory((prevCategory) => (prevCategory === category ? null : category));
  };

  const renderRecipe = (recipe) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => navigation.navigate('RecipeDetail', { recipe, deleteRecipe })}
    >
      <Text style={styles.recipeName}>{recipe.name}</Text>
    </TouchableOpacity>
  );

  const renderCategory = (category) => {
    const categoryRecipes = recipes.filter((recipe) => recipe.category.includes(category));

    return (
      <View key={category} style={styles.categoryContainer}>
        <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category)}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <Text style={styles.categoryToggle}>{expandedCategory === category ? '-' : '+'}</Text>
        </TouchableOpacity>
        {expandedCategory === category && (
          <View style={styles.recipeList}>
            {categoryRecipes.length > 0 ? (
              categoryRecipes.map((recipe) => renderRecipe(recipe))
            ) : (
              <Text style={styles.noRecipeText}>Aucune recette dans cette catégorie.</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Bibliothèque de recettes</Text>

      {categories.map((category) => renderCategory(category))}

      <View style={styles.buttonContainer}>
        <Button title="Ajouter une recette" onPress={() => navigation.navigate('AddRecipe', { addRecipe })} />
        <Button title="Importer un fichier .json" onPress={importRecipesFromJson} />
        <Button title="Partager mes recettes" onPress={exportRecipes} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryToggle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recipeList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  recipeItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  recipeName: {
    fontSize: 16,
  },
  noRecipeText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
});
