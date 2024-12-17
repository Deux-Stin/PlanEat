import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from "react";
import { Platform, View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAsyncStorage } from "../hooks/useAsyncStorage";
import ImageBackgroundWrapper from "../components/ImageBackgroundWrapper"; // Import du wrapper
import RecipeUtils from "../utils/RecipeUtils"; // Import des fonctions utilitaires

import { globalStyles } from "../globalStyles";

export default function RecipeLibrary({ navigation, route }) {
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage("backgroundIndex", 0); // Recupère l'index du background actuel
  const [recipes, setRecipes, getStoredRecipes] = useAsyncStorage("recipes", []);
  const [mealChoice, setMealChoice, getStoredMealChoice] = useAsyncStorage("mealChoice", []);
    const [defaultServings, setDefaultServings] = useAsyncStorage("defaultServings", 2);
  const [mealPlanFromAssignation, setMealPlanFromAssignation] = useAsyncStorage("mealPlanFromAssignation", {});
  const [expandedCategory, setExpandedCategory] = useState(null);

  const [selectedSeasons, setSelectedSeason] = useState([]); // État pour le filtre saison
  const [selectedDuration, setSelectedDuration] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const clickCountRef = useRef(0); // Utiliser une référence pour stocker le compteur
  const timeoutRef = useRef(null); // Référence pour le timeout actif

  const seasonColors = {
    printemps: "#E6F3CE",
    été: "#FFDFBA",
    automne: "#FFFFBA",
    hiver: "#BAE1FF",
    default: "#ccc",
  };

  const toggleSeason = (season) => {
    setSelectedSeason((prev) => (prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]));
  };

  const toggleDuration = (duration) => {
    setSelectedDuration(selectedDuration === duration ? null : duration);
  };

  // console.log('recipes :',recipes)

  // Fonction pour sauvegarder les recettes dans le fichier
  const saveRecipes = async (newRecipes) => {
    if (newRecipes && Array.isArray(newRecipes)) {
      try {
        setRecipes(newRecipes);
        console.log("Recettes sauvegardées.");
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des recettes :", error);
      }
    } else {
      console.error("Tentative de sauvegarde d'un tableau invalide.", newRecipes);
    }
  };

  // Vérifier si une mise à jour est nécessaire
  useEffect(() => {
    if (route.params?.refresh) {
      if (route.params?.refresh) {
        loadRecipes(); // Recharge les données lorsqu'un rafraîchissement est demandé
      }
      navigation.setParams({ refresh: false }); // Réinitialiser le paramètre pour éviter des boucles infinies
    }
  }, [route.params?.refresh]);

  // Met à jour `mealChoice` et `recipeNames` lorsqu'on revient sur la page
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      const storedMealChoice = await getStoredMealChoice();
      // console.log("Reloading mealChoice on focus:", storedMealChoice);
      setMealChoice(storedMealChoice);
      // console.log(JSON.stringify(storedMealChoice,2,null));
    });

    return unsubscribe; // Nettoie l'écouteur lors du démontage
  }, [navigation, getStoredMealChoice]);

  const recipeNames = mealChoice.map((recipe) => recipe.name);

  // Paramétrage de l'en-tête avec le bouton retour et le bouton favoris avec "i"
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitleVisible: false, // pour afficher la flèche de retour par défaut
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={25} color="#000" marginLeft={15} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => handlePanierClick()} style={styles.iconButton}>
          <Text style={styles.panier}>🛒</Text>
          <View style={styles.recipesNumber}>
            <Text style={styles.recipesNumberText}>
              {Array.isArray(recipeNames) ? (recipeNames.length > 10 ? "..." : recipeNames.length) : "0"}
            </Text>
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, menuVisible, recipeNames]);

  const loadRecipes = async () => {
    const recipes = await getStoredRecipes(); // Récupère les recettes depuis le stockage
    setRecipes(recipes); // Met à jour l'état local
  };

  // Gestion de l'import des recettes
  const importRecipesFromJsonOrTxt = async () => {
    const importedRecipes = await RecipeUtils.importRecipes();
    if (importedRecipes) {
      // Naviguer vers RecipeSelectionScreen avec les recettes importées
      navigation.navigate("RecipeSelectionScreen", {
        recipes: importedRecipes, // Passe les recettes importées uniquement
        mode: "import",
        onImport: importSelectedRecipes,
      });
    }
  };

  // Gestion de l'export
  const exportRecipesWithSelection = () => {
    navigateToSelectionScreen("export");
  };

  // Fonction pour l'import/export via RecipeSelectionScreen
  const navigateToSelectionScreen = (mode) => {
    navigation.navigate("RecipeSelectionScreen", {
      recipes,
      mode,
      onImport: importSelectedRecipes,
      onExport: exportSelectedRecipes,
    });
  };

  // Ajouter des recettes importées
  const importSelectedRecipes = (selectedRecipes) => {
    const updatedRecipes = RecipeUtils.addRecipes(recipes, selectedRecipes);
    setRecipes(updatedRecipes);
    Alert.alert("Succès", `${selectedRecipes.length} recettes ajoutées.`);
  };

  // Exporter des recettes sélectionnées
  const exportSelectedRecipes = async (selectedRecipes) => {
    const exportSuccess = await RecipeUtils.exportRecipes(selectedRecipes);
    if (exportSuccess) {
      Alert.alert("Succès", "Recettes exportées avec succès.");
    }
  };

  const deleteAllRecipes = () => {
    Alert.alert("Confirmation", "Voulez-vous vraiment supprimer toutes les recettes ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Oui",
        onPress: () => {
          setRecipes([]);
          saveRecipes([]);
        },
      },
    ]);
  };

  const categories = ["Apéritif", "Petit-déjeuner", "Entrée", "Plat", "Dessert", "Cocktail"];

  const toggleCategory = (category) => {
    setExpandedCategory((prevCategory) => (prevCategory === category ? null : category));
  };

  const renderRecipe = (recipe) => {
    const getSourceIcon = (source) => {
      switch (source) {
        case "Livre":
          return "📖"; // Émoticône pour le site1
        case "Bouche à oreille":
          return "🗣️"; // Émoticône pour le site2
        case "ChatGPT":
          return "🤖"; // Émoticône pour le site3
        case "Marmiton":
          return "🍲";
        case "Internet":
          return "🌐";
        default:
          return "❔"; // Émoticône par défaut si la source est inconnue
      }
    };

    return (
      <TouchableOpacity
        key={recipe.id}
        style={styles.recipeItem}
        onPress={() => navigation.navigate("RecipeDetail", { recipe }, { refresh: true })}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[styles.recipeSource, { marginRight: 10 }]}>
            {getSourceIcon(recipe.source)}
            {/* Affiche l'émoticône et la source */}
          </Text>
          <Text style={[styles.recipeName, globalStyles.textTitleDeux]}>{recipe.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filterRecipes = () => {
    return recipes.filter((recipe) => {
      // console.log('recipe.source : ', recipe.source)
      const recipeSeasons = recipe.season || [];
      const matchesSeason =
        selectedSeasons.length === 0 || recipeSeasons.some((season) => selectedSeasons.includes(season));
      const matchesDuration =
        selectedDuration === null || (recipe.duration && recipe.duration.includes(selectedDuration));
      // console.log('recipe.duration :', recipe.duration)
      // console.log('matchesDuration', matchesDuration)
      return matchesSeason && matchesDuration;
    });
  };

  const renderFilters = () => (
    <View style={styles.section}>
      {/* <Text style={styles.filtersHeader}></Text> */}
      <Text style={[styles.sectionTitle, globalStyles.textTitleDeux]}>Filtres</Text>
      <View style={styles.filterRow}>
        {Object.keys(seasonColors)
          .slice(0, -1)
          .map((season) => (
            <TouchableOpacity
              key={season}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedSeasons.includes(season) ? seasonColors[season] : "#fff", // Couleur par défaut
                },
              ]}
              onPress={() => toggleSeason(season)}
            >
              <Text style={[styles.filterText, globalStyles.textTitleDeux, { fontSize: 16 }]}>
                {season.charAt(0).toUpperCase() + season.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
      <View style={styles.durationRow}>
        <TouchableOpacity
          style={[
            styles.durationButton,
            {
              backgroundColor: selectedDuration === "court" ? "#FCE7E8" : "#fff",
            },
          ]}
          onPress={() => toggleDuration("court")}
        >
          <Text style={[styles.filterText, globalStyles.textTitleDeux]}>Court</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.durationButton,
            {
              backgroundColor: selectedDuration === "long" ? "#FCE7E8" : "#fff",
            },
          ]}
          onPress={() => toggleDuration("long")}
        >
          <Text style={[styles.filterText, globalStyles.textTitleDeux]}>Long</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategory = (category) => {
    const categoryRecipes = filterRecipes()
      .filter((recipe) => recipe.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)); // Trie les recettes par nom alphabétique

    // console.log("Recettes dans la catégorie:", category, categoryRecipes);

    return (
      <View key={category} style={styles.categoryContainer}>
        <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category)}>
          <Text style={[styles.categoryTitle, globalStyles.textTitleDeux]}>{category}</Text>
          <Text style={styles.categoryToggle}>{expandedCategory === category ? "-" : "+"}</Text>
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

  const handlePanierClick = () => {
    // console.log("mealChoice:", mealChoice);
    console.log("recipeNames:", recipeNames);

    clickCountRef.current += 1; // Incrémenter la référence
    console.log("clickCount:", clickCountRef.current);

    // Réinitialiser après 5 clics rapides
    if (clickCountRef.current === 3 && recipeNames.length > 0) {
      setMealChoice([]);
      setMealPlanFromAssignation([]);
      // setIsResetting(true); // Indiquer qu'une réinitialisation est en cours
      Alert.alert("Réinitialisation", "Les recettes sélectionnées ont été réinitialisées.");

      // Annuler le timeout actif pour éviter d'afficher le modal
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      clickCountRef.current = 0; // Réinitialiser le compteur
      return;
    }

    // Afficher le modal après un délai si moins de 3 clics et des recettes sont présentes
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        // Vérifier que le panier n'est pas vide
        if (recipeNames.length > 0) {
          setModalVisible(true);
        }
        // Toujours réinitialiser le compteur
        clickCountRef.current = 0;
        timeoutRef.current = null; // Réinitialiser la référence du timeout
      }, 500);
    }
  };

  const deleteRecipeModal = (indexToDelete) => {
    setMealChoice((prevChoices) => prevChoices.filter((_, index) => index !== indexToDelete));
  };

  const handleGoToShoppingList = async () => {
    setModalVisible(false);
  
    try {
      // Récupérer les recettes sélectionnées depuis le stockage
      const storedMealChoice = await getStoredMealChoice();
  
      if (!storedMealChoice || storedMealChoice.length === 0) {
        Alert.alert("Erreur", "Aucune recette sélectionnée pour la liste de courses.");
        return;
      }
  
      const mealPlan = {};
      const date = "2000-01-01"; // Ajouter votre date ici

      // Transformer les données pour la liste de courses
      mealPlan[date] = storedMealChoice.reduce((acc, recipe) => {
        const categoryKey = recipe.category; // Catégorie en minuscule
        if (!acc[categoryKey]) acc[categoryKey] = []; // Initialiser la catégorie si nécessaire
  
        acc[categoryKey].push({
          ...recipe,
          servingsSelected: defaultServings || recipe.servingsSelected, // Ajouter ou conserver les portions sélectionnées
        });
  
        return acc;
      }, {});
  
      // Vérification des données avant de naviguer
      // console.log("Liste pour la liste de courses :", JSON.stringify(mealChoiceForShoppingList, null, 2));
      console.log(mealPlan);
  
      // Navigation vers l'écran de liste de courses
      navigation.navigate("ShoppingListScreen", { mealPlan });
    } catch (error) {
      console.error("Erreur lors de la récupération des recettes :", error);
      Alert.alert("Erreur", "Impossible de récupérer les recettes pour la liste de courses.");
    }
  };
  

  return (
    <ImageBackgroundWrapper backgroundIndex={backgroundIndex} imageOpacity={0.6}>
      <View>
        {/* Votre contenu principal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Bouton de fermeture en haut à droite */}
              <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)}>
                <View style={styles.iconButtonBackground} />
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>

              {/* Titre du Modal */}
              <Text style={styles.sectionTitle}>Recettes sélectionnées :</Text>

              {/* Liste des Recettes */}
              <ScrollView>
              {mealChoice.map((recipe, index) => (
                <View key={index} style={styles.recipeRow}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteRecipeModal(index)} // Appelle la fonction de suppression
                  >
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              ))}
              </ScrollView>

               {/* Boutons */}
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate("MealAssignmentScreen");
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Passer à l'attribution</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGoToShoppingList}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Voir ma liste de courses</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

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
            <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate("AddRecipe")}>
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Ajouter une recette</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={importRecipesFromJsonOrTxt}>
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Importer un fichier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={exportRecipesWithSelection}>
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Exporter des recettes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={deleteAllRecipes}>
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Supprimer mes recettes</Text>
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
    padding: 10,
    // backgroundColor: '#fff',
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-evenly", // Espace uniforme entre les boutons
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-evenly", // Espace uniforme entre les boutons
    marginTop: 0, // Ajoute un peu d'espace au-dessus
  },
  durationButton: {
    flex: 1, // Chaque bouton prend l'espace disponible
    marginHorizontal: 2.5, // Marge horizontale pour espacer les boutons
    padding: 10, // Padding pour rendre le bouton plus grand
    alignItems: "center", // Centre le texte horizontalement
    justifyContent: "center", // Centre le texte verticalement
    borderRadius: 5, // Coins arrondis
  },
  filterButton: {
    paddingHorizontal: 2,
    paddingVertical: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    flex: 1, // Ajout pour égaliser la taille des boutons
    marginHorizontal: 2, // Ajoute un léger espacement horizontal entre les boutons
  },
  selectedFilter: {
    backgroundColor: "#b0e0e6",
  },
  filterText: {
    color: "#000",
    fontSize: 16,
    textAlign: "center", // Centrer le texte dans les boutons
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    opacity: 0.8,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryTitle: {
    fontSize: 20,
    // fontWeight: 'bold',
    color: "#000",
  },
  categoryToggle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  recipeList: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginTop: 5,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  recipeItem: {
    paddingVertical: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  recipeName: {
    fontSize: 16,
    flex: 1, // Le texte peut s'étendre dans l'espace disponible
    flexShrink: 1, // Réduire la taille du texte si nécessaire
    marginRight: 10, // Espacement entre le texte et le bouton
  },
  noRecipeText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
  },
  buttonContainer: {
    marginTop: 20,
  },
  mainButton: {
    backgroundColor: "#fff",
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: "center",
    width: "100%",
  },
  mainButtonText: {
    color: "#000",
    fontSize: 18,
    // fontWeight: 'bold',
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 30,
    // fontWeight: 'bold',
    color: "#444",
    marginTop: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 5,
    paddingBottom: 40,
  },
  panier: {
    fontSize: 30,
    color: "#000",
    marginRight: 15,
    zIndex: 10,
    elevation: 10,
  },
  recipesNumber: {
    position: "absolute",
    backgroundColor: "red",
    // opacity: 0.1,
    fontSize: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    bottom: 25,
  },
  recipesNumberText: {
    color: "#fff",
    // fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center", // Pour aligner le modal en bas de l'écran
    backgroundColor: "rgba(0, 0, 0, 0.35)", // Fond semi-transparent
  },
  modalContainer: {
    backgroundColor: "white",
    maxHeight: "90%", // Limiter la hauteur du modal
    marginVertical: "10%", // Ajuster cette valeur pour tenir compte de la hauteur de l'en-tête
    marginHorizontal: "10%", // Créer une marge horizontale pour ne pas remplir toute la largeur
    borderRadius: 10,
    padding: 15,
    // alignItems: "center",
    // paddingTop: 40, // Espace pour la croix de fermeture
    // position: "relative",
  },
  iconButtonBackground: {
    ...StyleSheet.absoluteFillObject, // Prend tout l'espace du bouton
    backgroundColor: "#D8D8D8",
    opacity: 0.5, // Opacité appliquée uniquement au fond
    borderRadius: 5, // Coins arrondis pour le fond
  },
  closeIcon: {
    position: "absolute",
    top: 15,
    right: 20,
    width: 20,
    zIndex: 1,
    backgroundColor: '#fff',
    alignItems : 'center',
  },
  closeIconText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "bold",
  },
  recipeRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Place le texte et le bouton aux extrémités
    alignItems: "center",
    marginVertical: 2.5,
    paddingVertical: 2.5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    // paddingHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d", // Rouge pour le bouton
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Nécessaire pour positionner le cercle
  },
});
