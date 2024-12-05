import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Button,
  TouchableOpacity,
} from "react-native";
import { Checkbox } from "react-native-paper";
import { useAsyncStorage } from "../hooks/useAsyncStorage";
import ImageBackgroundWrapper from "../components/ImageBackgroundWrapper"; // Import du wrapper
import { globalStyles } from "../globalStyles";

const RecipeSelectionScreen = ({ route, navigation }) => {
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage('backgroundIndex', 0); //Recupère l'index du background
  const { recipes = [], mode, onImport, onExport } = route.params || {};
  const [groupedRecipes, setGroupedRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState(
    recipes.reduce((acc, recipe) => {
      acc[recipe.id] = true;
      return acc;
    }, {})
  );

  const availableCategories = [
    "Apéritif",
    "Petit-déjeuner",
    "Entrée",
    "Plat",
    "Dessert",
    "Cocktail",
  ];

  useEffect(() => {
    // Grouper les recettes par catégorie
    const grouped = availableCategories
      .map((category) => ({
        title: category,
        data: recipes.filter((recipe) => recipe.category === category),
      }))
      .filter((section) => section.data.length > 0);

    setGroupedRecipes(grouped); // Met à jour l'état avec les recettes importées
  }, [recipes]); // Inclut les recettes reçues via navigation

  // Basculer la sélection d'une recette
  const toggleSelection = (recipeId) => {
    setSelectedRecipes((prev) => ({
      ...prev,
      [recipeId]: !prev[recipeId],
    }));
  };

  // Tout sélectionner ou désélectionner
  const toggleAll = (selectAll) => {
    const newSelection = recipes.reduce((acc, recipe) => {
      acc[recipe.id] = selectAll;
      return acc;
    }, {});
    setSelectedRecipes(newSelection);
  };

  const handleAction = () => {
    const selected = recipes.filter((recipe) => selectedRecipes[recipe.id]);
    if (mode === "import") onImport(selected);
    if (mode === "export") onExport(selected);
    navigation.goBack();
  };

  return (
    <ImageBackgroundWrapper backgroundIndex={backgroundIndex} imageOpacity={0.3}>
      <View style={styles.container}>
        <SectionList
          sections={groupedRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recipeItem}>
              <Checkbox
                status={selectedRecipes[item.id] ? "checked" : "unchecked"}
                onPress={() => toggleSelection(item.id)}
              />
              <Text style={styles.recipeName}>{item.name}</Text>
            </View>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, globalStyles.textTitleDeux]}>
              {title}
            </Text>
          )}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => toggleAll(true)} // Position correcte de onPress
            style={styles.mainButton}
          >
            <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>
              Tout sélectionner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleAll(false)} // Position correcte de onPress
            style={styles.mainButton}
          >
            <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>
              Tout désélectionner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAction} style={styles.mainButton}>
            <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>
              {mode === "import" ? "Importer" : "Exporter"}
            </Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </ImageBackgroundWrapper>
  );
};

export default RecipeSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // backgroundColor: "#f9f9f9",
  },
  sectionHeader: {
    fontSize: 25,
    // fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  recipeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  recipeName: {
    marginLeft: 8,
    fontSize: 16,
    color: "#555",
  },
  actions: {
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
});
