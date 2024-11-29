import React, { useState, useEffect } from 'react';
import { Platform, View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import uuid from 'react-native-uuid';
import ImageBackgroundWrapper from '../components/ImageBackgroundWrapper'; // Import du wrapper

export default function RecipeLibrary({ navigation, route }) {
  const [recipes, setRecipes] = useAsyncStorage('recipes', []);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const [selectedSeasons, setSelectedSeason] = useState([]); // État pour le filtre saison
  const [selectedDuration, setSelectedDuration] = useState([]);

  const seasonColors = {
    printemps: '#E6F3CE',
    été: '#FFDFBA',
    automne: '#FFFFBA',
    hiver: '#BAE1FF',
    default: '#ccc',
  };

  const toggleSeason = (season) => {
    setSelectedSeason((prev) =>
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  const toggleDuration = (duration) => {
    setSelectedDuration(selectedDuration === duration ? null : duration);
  };
  
  // console.log('recipes :',recipes)

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

  const importRecipesFromJsonOrTxt = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'], // Permet de sélectionner JSON ou TXT
        copyToCacheDirectory: true,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri, mimeType } = result.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(uri);
        console.log('Contenu du fichier :', fileContent);
  
        let jsonData;
        if (mimeType === 'application/json') {
          // Si le fichier est un JSON
          try {
            jsonData = JSON.parse(fileContent);
          } catch (error) {
            console.error('Erreur lors de l\'analyse JSON :', error);
            Alert.alert('Erreur', 'Le fichier JSON est mal formé.');
            return;
          }
        } else if (mimeType === 'text/plain') {
          // Si le fichier est un TXT, reconstruire un objet JSON
          try {
            jsonData = parseTxtToJson(fileContent); // Fonction personnalisée pour convertir TXT en JSON
          } catch (error) {
            console.error('Erreur lors du traitement TXT :', error);
            Alert.alert('Erreur', 'Le fichier TXT est mal formaté.');
            return;
          }
        } else {
          Alert.alert('Erreur', 'Format de fichier non pris en charge.');
          return;
        }
  
        // Vérifie si les recettes sont valides
        if (!Array.isArray(jsonData.recipes)) {
          console.error('Les recettes importées ne sont pas un tableau. Vérifiez le format du fichier.');
          Alert.alert('Erreur', 'Le fichier importé ne contient pas de recettes valides.');
          return;
        }
  
        // Ajouter les nouvelles recettes comme avant
        const newRecipes = jsonData.recipes;
        const updatedRecipes = [...recipes];
        let nbNewRecipes = 0;
  
        newRecipes.forEach(newRecipe => {
          const existingRecipe = updatedRecipes.find(
            r => r.id === newRecipe.id || r.name === newRecipe.name
          );
  
          if (!existingRecipe) {
            newRecipe.id = uuid.v4();
            updatedRecipes.push(newRecipe);
            nbNewRecipes++;
          }
        });
  
        setRecipes(updatedRecipes);
        Alert.alert('Recettes mises à jour', `${nbNewRecipes} nouvelle(s) recette(s) ajoutée(s).`);
      } else {
        console.log('Aucun fichier sélectionné ou processus annulé.');
      }
    } catch (err) {
      console.error('Erreur lors de l\'importation du fichier :', err);
    }
  };
  
  // Fonction pour convertir un fichier TXT en JSON
  const parseTxtToJson = (fileContent) => {
    // Exemple simple : Attendez-vous à une structure lisible comme :
    // - Nom: Recette 1
    // - Durée: 30 minutes
    // ...
    const lines = fileContent.split('\n');
    const recipes = [];
    let currentRecipe = {};
  
    lines.forEach(line => {
      if (line.trim() === '') {
        // Nouvelle recette si une ligne est vide
        if (Object.keys(currentRecipe).length > 0) {
          recipes.push(currentRecipe);
          currentRecipe = {};
        }
      } else {
        const [key, value] = line.split(':');
        if (key && value) {
          currentRecipe[key.trim().toLowerCase()] = value.trim();
        }
      }
    });
  
    if (Object.keys(currentRecipe).length > 0) {
      recipes.push(currentRecipe); // Ajouter la dernière recette
    }
  
    return { recipes };
  };
  

  const exportRecipes = async () => {
    try {

      const sanitizedRecipes = recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        source: recipe.source,
        category: recipe.category,
        duration: recipe.duration,
        season: recipe.season,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        recipe: recipe.recipe,
        nutritionalValues: recipe.nutritionalValues,
      }));

      // console.log('sanitizedRecipes : ',sanitizedRecipes)

      // Convertir les recettes en JSON
      // const jsonRecipes = JSON.stringify({recipes: sanitizedRecipes}, null, 2);
  
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
          { text: "Partager", onPress: async () => await shareRecipes(sanitizedRecipes) },
          { 
            text: "Exporter", 
            onPress: () => {
              // Si l'utilisateur choisit d'exporter, on lui propose de choisir entre TXT ou JSON
              Alert.alert(
                "Choisissez le format d'exportation",
                "Sélectionnez un format :",
                [
                  { text: "Exporter en TXT", onPress: async () => await saveRecipesToCustomDirectory(sanitizedRecipes, 'txt') },
                  { text: "Exporter en JSON", onPress: async () => await saveRecipesToCustomDirectory(sanitizedRecipes, 'json') },
                  { text: "Annuler", style: "cancel" }
                ]
              );
            }
          },
          { text: "Annuler", style: "cancel" }
        ]
      );
      
      
      
    } catch (error) {
      console.error('Erreur lors de l\'exportation des recettes :', error);
    }
  };
  
  const shareRecipes = async (sanitizedRecipes) => {
    const jsonRecipes = JSON.stringify({recipes: sanitizedRecipes}, null, 2);
    try {
      // Créer un fichier temporaire
      const filePath = `${FileSystem.cacheDirectory}recipes.txt`;
      await FileSystem.writeAsStringAsync(filePath, jsonRecipes);
  
      // Partager le fichier
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Erreur lors du partage des recettes :', error);
    }
  };

  const deleteAllRecipes = () => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer toutes les recettes ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Oui", 
          onPress: () => {
            setRecipes([]);
            saveRecipes([]);
          }
        }
      ]
    );
  };
  
  const saveRecipesToCustomDirectory = async (jsonRecipes, format) => {
    try {
      // Définir le nom et le type MIME du fichier
      const fileName = `recipes.${format}`;
      const mimeType = format === 'json' ? 'application/json' : 'text/plain';

      // Générer le contenu du fichier
      let fileContent;

      if (format === 'json' || format === 'txt') {
        // Générer un JSON formaté avec indentation pour .json et .txt
        const formattedRecipes = { recipes: jsonRecipes };
        fileContent = JSON.stringify(formattedRecipes, null, 2); // Beautifié avec indentations
      } else {
        throw new Error('Format non supporté');
      }

      if (!fileContent) {
        throw new Error('Contenu du fichier vide ou invalide.');
      }

      console.log('Contenu généré pour le fichier :', fileContent);
  
      if (Platform.OS === 'android') {
        // Demander les permissions pour accéder au répertoire
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  
        if (permissions.granted) {
          // Créer un fichier dans le répertoire sélectionné
          await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, mimeType)
            .then(async (fileUri) => {
              // Écrire les données dans le fichier
              await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.UTF8 });

              // const decodeUri = (encodedUri) => decodeURIComponent(encodedUri);
              // const readablePath = decodeUri(fileUri);
              // console.log('Chemin lisible :', readablePath);
              const readablePath = getReadablePath(fileUri);
              console.log('Chemin lisible :', readablePath);

              Alert.alert('Succès', `Les recettes ont été enregistrées dans :\n${readablePath}`);
            })
            .catch((error) => {
              console.error('Erreur lors de la création du fichier :', error);
              Alert.alert('Erreur', 'Impossible de créer le fichier.');
            });
        } else {
          // L'utilisateur n'a pas accordé les permissions
          Alert.alert('Permissions refusées', 'Impossible d\'accéder au répertoire sélectionné.');
        }
      } else {
        // iOS : Partager le fichier avec d'autres applications
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.UTF8 });
  
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType });
        } else {
          Alert.alert('Partage indisponible', 'Le partage n\'est pas supporté sur cet appareil.');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des recettes :', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les recettes.');
    }
  };
  
  const getReadablePath = (fileUri) => {
    // Décoder l'URI
    const decodedUri = decodeURIComponent(fileUri);
  
    // Supprimer le préfixe principal
    const withoutPrefix = decodedUri.replace('content://com.android.externalstorage.documents/tree/primary:', '');
  
    // Trouver où commence la redondance après "document/primary:"
    const parts = withoutPrefix.split('document/primary:');
    if (parts.length > 1) {
      // S'assurer que la seconde partie n'est pas redondante avec la première
      if (parts[1].startsWith(parts[0])) {
        return parts[1]; // Garder seulement la deuxième partie
      }
    }
  
    // Si pas de redondance détectée, garder le chemin original nettoyé
    return withoutPrefix;
  };

  const categories = ['Apéritif','Petit-déjeuner','Entrée','Plat','Dessert','Cocktail'];

  const toggleCategory = (category) => {
    setExpandedCategory((prevCategory) => (prevCategory === category ? null : category));
  };

  const renderRecipe = (recipe) => {
    
    const getSourceIcon = (source) => {
      switch (source) {
        case 'Livre':
          return '📖'; // Émoticône pour le site1
        case 'Bouche à oreille':
          return '🗣️'; // Émoticône pour le site2
        case 'ChatGPT':
          return '🤖'; // Émoticône pour le site3
        case 'Marmiton':
          return '🍲';
        case 'Internet':
          return '🌐';
        default:
          return '❔'; // Émoticône par défaut si la source est inconnue
      }
    };

    return (
      <TouchableOpacity
        key={recipe.id}
        style={styles.recipeItem}
        onPress={() => navigation.navigate('RecipeDetail', { recipe, deleteRecipe })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
          <Text style={[styles.recipeSource, {marginRight: 10}]}>
            {getSourceIcon(recipe.source)}{/* Affiche l'émoticône et la source */}
          </Text>
          <Text style={styles.recipeName}>{recipe.name}</Text>
        </View>
      </TouchableOpacity>
    )
  };

  const filterRecipes = () => {
    return recipes.filter(recipe => {
      // console.log('recipe.source : ', recipe.source)
      const recipeSeasons = recipe.season || [];
      const matchesSeason = selectedSeasons.length === 0 || recipeSeasons.some(season => selectedSeasons.includes(season));
      const matchesDuration = selectedDuration === null || (recipe.duration && recipe.duration.includes(selectedDuration));
      // console.log('recipe.duration :', recipe.duration)
      // console.log('matchesDuration', matchesDuration)
      return matchesSeason && matchesDuration;
    });
  };

  const renderFilters = () => (
    <View style={styles.section}>
      {/* <Text style={styles.filtersHeader}></Text> */}
      <Text style={styles.sectionTitle}>Filtres</Text>
      <View style={styles.filterRow}>
        {Object.keys(seasonColors).slice(0, -1).map(season => (
          <TouchableOpacity
            key={season}
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedSeasons.includes(season) ? seasonColors[season] : '#fff' // Couleur par défaut
              }
            ]}
            onPress={() => toggleSeason(season)}
          >
            <Text style={styles.filterText}>{season.charAt(0).toUpperCase() + season.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.durationRow}>
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: selectedDuration === 'court' ? '#FCE7E8' : '#fff' }]}
          onPress={() => toggleDuration('court')}
        >
          <Text style={styles.filterText}>Court</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: selectedDuration === 'long' ? '#FCE7E8' : '#fff' }]}
          onPress={() => toggleDuration('long')}
        >
          <Text style={styles.filterText}>Long</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategory = (category) => {
    const categoryRecipes = filterRecipes()
      .filter((recipe) => recipe.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)); // Trie les recettes par nom alphabétique

    console.log("Recettes dans la catégorie:", category, categoryRecipes);

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
    <ImageBackgroundWrapper imageOpacity={0.6}>
      <ScrollView style={styles.container}>
        {/* <Text style={styles.header}>Bibliothèque de recettes</Text> */}

        {renderFilters()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}></Text>
          {categories.map((category) => renderCategory(category))}
        </View>

        <View style={styles.section}>
        
          <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}></Text>
            <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('AddRecipe', { addRecipe })}>
              <Text style={styles.mainButtonText}>Ajouter une recette</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={importRecipesFromJsonOrTxt}>
              <Text style={styles.mainButtonText}>Importer un fichier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={exportRecipes}>
              <Text style={styles.mainButtonText}>Partager mes recettes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={deleteAllRecipes}>
              <Text style={styles.mainButtonText}>Supprimer mes recettes</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#fff',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Espace uniforme entre les boutons
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Espace uniforme entre les boutons
    marginTop: 0, // Ajoute un peu d'espace au-dessus
  },
  durationButton: {
    flex: 1, // Chaque bouton prend l'espace disponible
    marginHorizontal: 2.5, // Marge horizontale pour espacer les boutons
    padding: 10, // Padding pour rendre le bouton plus grand
    alignItems: 'center', // Centre le texte horizontalement
    justifyContent: 'center', // Centre le texte verticalement
    borderRadius: 5, // Coins arrondis
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    flex: 1, // Ajout pour égaliser la taille des boutons
    marginHorizontal: 2.5, // Ajoute un léger espacement horizontal entre les boutons
  },
  selectedFilter: {
    backgroundColor: '#b0e0e6',
  },
  filterText: {
    fontSize: 16,
    textAlign: 'center', // Centrer le texte dans les boutons
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    opacity: 0.8,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#fff',
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
    marginHorizontal: 10,
    marginTop: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  recipeItem: {
    paddingVertical: 10,
    paddingRight: 10,
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
  mainButton: {
    backgroundColor: '#fff',
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    width: '100%',
  },
  mainButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 5,
    paddingBottom: 40,
  },
});
