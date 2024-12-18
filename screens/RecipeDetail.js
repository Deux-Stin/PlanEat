import { useKeepAwake } from "expo-keep-awake";
import React from "react";
import uuid from "react-native-uuid";
import { ScrollView, Text, Button, Image, Alert, StyleSheet, View, TouchableOpacity } from "react-native";
import { useAsyncStorage } from "../hooks/useAsyncStorage";
import ImageBackgroundWrapper from "../components/ImageBackgroundWrapper"; // Import du wrapper
import { globalStyles } from "../globalStyles";

export default function RecipeDetail({ route, navigation }) {
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage("backgroundIndex", 0); //Recupère l'index du background
  const { recipe, showPaniers = true } = route.params; // affiche les caddy pour "+" et "-" sauf si on envoie la variable showPaniers à false 

  const [storedRecipes, setStoredRecipes] = useAsyncStorage("recipes", []);
  const [mealChoice, setMealChoice] = useAsyncStorage("mealChoice", []);

  // Empêche l'écran de s'éteindre lorsque l'on suit une recette
  useKeepAwake();

  const addToMealChoice = () => {
    setMealChoice((prevMealChoice) => {
      // Ajoute un instanceId unique à la recette
      const recipeWithId = { ...recipe, instanceId: uuid.v4() };

      const updatedMealChoice = [...prevMealChoice, recipeWithId];

      const recipeNames = updatedMealChoice.map((recipe) => recipe.name);
      console.log("Liste des noms des recettes choisies :", recipeNames);

      return updatedMealChoice;
    });

    navigation.goBack();
  };

  const removeFromMealChoice = () => {
    setMealChoice((prevMealChoice) => {
      const updatedMealChoice = prevMealChoice.filter((item) => item.name !== recipe.name);

      console.log(
        "Liste mise à jour des noms des recettes choisies :",
        updatedMealChoice.map((r) => r.name)
      );
      return updatedMealChoice;
    });

    Alert.alert("Info", `La recette "${recipe.name}" a été retirée de votre sélection.`);
  };

  const handleDelete = async () => {
    Alert.alert("Confirmation", `Êtes-vous sûr de vouloir supprimer la recette ${recipe.name} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        onPress: async () => {
          try {
            const updatedRecipes = storedRecipes.filter((r) => r.name !== recipe.name);
            await setStoredRecipes(updatedRecipes);
            // await deleteRecipe(recipe);
            navigation.navigate("RecipeLibrary", { refresh: true });
          } catch (error) {
            console.error("Erreur lors de la suppression de la recette :", error);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    console.log("recipe : ", recipe);
    navigation.navigate("AddRecipe", {
      recipe,
      // addRecipe: addRecipe
    });
  };

  return (
    <ImageBackgroundWrapper backgroundIndex={backgroundIndex} imageOpacity={0.5}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* En-tête avec le titre */}
        <View style={styles.header}>
          
        {showPaniers && (
   <TouchableOpacity style={styles.iconButton} onPress={removeFromMealChoice}>
      {/* Fond semi-transparent */}
      <View style={styles.iconButtonBackground} />

      {/* Contenu (icônes) */}
      <View style={styles.iconButtonContent}>
         <Text style={styles.panier}>🛒</Text>
         <Text style={styles.iconMoreOrLess}>-</Text>
      </View>
   </TouchableOpacity>
)}
<Text style={[styles.title, globalStyles.textTitleDeux]}>{recipe.name}</Text>
{showPaniers && (
   <TouchableOpacity style={styles.iconButton} onPress={addToMealChoice}>
      {/* Fond semi-transparent */}
      <View style={styles.iconButtonBackground} />

      {/* Contenu (icônes) */}
      <View style={styles.iconButtonContent}>
         <Text style={styles.panier}>🛒</Text>
         <Text style={styles.iconMoreOrLess}>+</Text>
      </View>
   </TouchableOpacity>
)}

        </View>

        {/* Affichage de l'image de la recette */}
        {recipe.image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: recipe.image }} style={styles.imageWithBorder} />
          </View>
        ) : (
          <Text style={{ textAlign: "center" }}></Text>
        )}

        {/* Section Détails de la recette */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, globalStyles.textTitleTrois]}>Détails de la recette</Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Catégorie : </Text>
            {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) || "Non spécifié"}
          </Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée : </Text>
            {recipe.duration.charAt(0).toUpperCase() + recipe.duration.slice(1) || "Non spécifié"}
          </Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Source: </Text>
            {recipe.source.charAt(0).toUpperCase() + recipe.source.slice(1) || "Non spécifié"}
          </Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Saison : </Text>
            {Array.isArray(recipe.season) && recipe.season.length > 0
              ? recipe.season
                  .map((item) => item.charAt(0).toUpperCase() + item.slice(1)) // Transforme chaque élément
                  .join(", ") // Combine les éléments en une chaîne
              : "Non spécifié"}
          </Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Nombre de parts : </Text>
            {recipe.servings || "Non spécifié"}
          </Text>
        </View>

        {/* Section Ingrédients */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, globalStyles.textTitleTrois]}>Ingrédients</Text>
          {recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.itemText}>
                - <Text>{ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}</Text> :{" "}
                {ingredient.quantity} {ingredient.unit}
              </Text>
            ))
          ) : (
            <Text style={styles.itemText}>Aucun ingrédient spécifié</Text>
          )}
        </View>

        {/* Section Recette */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, globalStyles.textTitleTrois]}>Étapes de la Recette</Text>
          {recipe.recipe.length > 0 ? (
            recipe.recipe.map((step, index) => (
              <Text key={index} style={[styles.itemText, { marginBottom: 15 }]}>
                {index + 1}. {step}
              </Text>
            ))
          ) : (
            <Text style={styles.itemText}>Aucune étape spécifiée</Text>
          )}
        </View>

        {/* Section Valeurs nutritionnelles */}
        {((recipe.nutritionalValues?.glucides && recipe.nutritionalValues?.glucides !== "0") ||
          (recipe.nutritionalValues?.proteines && recipe.nutritionalValues?.proteines !== "0") ||
          (recipe.nutritionalValues?.graisses && recipe.nutritionalValues?.graisses !== "0") ||
          (recipe.nutritionalValues?.kiloCalories && recipe.nutritionalValues?.kiloCalories !== "0")) && (
          <View style={styles.nutritionalSection}>
            <Text style={[styles.sectionTitle, globalStyles.textTitleTrois]}>Valeurs nutritionnelles</Text>

            {/* Ligne pour Glucides et Protéines */}
            <View style={styles.nutritionalRow}>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>Glucides:</Text>
                <Text style={styles.itemValue}>{recipe.nutritionalValues?.glucides || "Non spécifié"}</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>Protéines:</Text>
                <Text style={styles.itemValue}>{recipe.nutritionalValues?.proteines || "Non spécifié"}</Text>
              </View>
            </View>

            {/* Ligne pour Graisses et kCalories */}
            <View style={styles.nutritionalRow}>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>Graisses:</Text>
                <Text style={styles.itemValue}>{recipe.nutritionalValues?.graisses || "Non spécifié"}</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>kCal:</Text>
                <Text style={styles.itemValue}>{recipe.nutritionalValues?.kiloCalories || "Non spécifié"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Boutons Modifier et Supprimer */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonWrapper} onPress={handleEdit}>
            <Text style={styles.buttonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonWrapper} onPress={handleDelete}>
            <Text style={styles.buttonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    // backgroundColor: '#fff',
    alignItems: "center", // Centrer horizontalement
  },
  header: {
    marginTop: 20,
    paddingHorizontal: 10,
    flexDirection: "row", // Alignement des colonnes
    alignItems: "center",
    justifyContent: "space-between", // Espacement uniforme entre les éléments
    width: "95%", // Largeur de l'en-tête pour garder un espacement uniforme
  },
  title: {
    fontSize: 30,
    color: "#333",
    textAlign: "center", // Centrer le texte du titre
    flex: 1, // Permet au titre d'occuper la largeur restante
    marginHorizontal: 5,
  },
  section: {
    marginBottom: 20,
    width: "95%", // Prendre toute la largeur disponible
  },
  sectionTitle: {
    fontSize: 22,
    // fontWeight: 'bold',
    color: "#444",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    textAlign: "center", // Centrer le texte des sections
  },
  nutritionalSection: {
    marginBottom: 20,
    width: "70%",
  },
  nutritionalRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Répartit uniformément les éléments sur chaque ligne
    alignItems: "center",
    marginVertical: 5, // Espace entre chaque ligne
  },
  nutritionalItem: {
    width: "45%", // Assure que chaque élément occupe la moitié de la ligne
    flexDirection: "row",
    justifyContent: "flex-start", // Alignement à gauche pour l’étiquette
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 16,
    textAlign: "right", // Aligne les labels à droite
    paddingRight: 5, // Espace entre le label et la valeur
  },
  itemValue: {
    fontSize: 16,
    textAlign: "left", // Aligne les valeurs à gauche de leur propre cellule
  },
  detailItem: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center", // Centrer le texte des détails
  },
  detailLabel: {
    fontWeight: "bold",
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center", // Centrer le texte des ingrédients et étapes
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    // marginTop: 20,
  },
  buttonWrapper: {
    backgroundColor: "#fff",
    opacity: 0.8,
    padding: 15,
    marginVertical: 5,
    marginRight: 8,
    borderRadius: 10, // Border radius appliqué ici
    flexBasis: "48%",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  buttonText: {
    color: "#000", // Couleur du texte
    fontSize: 16,
  },
  mainButton: {
    backgroundColor: "#fff",
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5, // Espace entre les boutons
    alignItems: "center",
    width: "100%", // Ajuster la largeur pour ne pas prendre toute la place
  },
  mainButtonText: {
    color: "#000",
    fontSize: 18,
    // fontWeight: 'bold',
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 10,
    marginBottom: 30,
  },
  imageWithBorder: {
    width: 300,
    height: 300,
    borderWidth: 2.5,
    borderColor: "#FFFFFF", // Bordure blanche
    borderRadius: 50, // Coins arrondis plus extrêmes
    padding: 5, // L'espace entre l'image et la bordure
    backgroundColor: "#f4f4f4", // Couleur d'arrière-plan neutre
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5, // Ombre sur Android
    overflow: "hidden", // Important pour garder les coins arrondis
  },
  italicText: {
    fontStyle: "italic", // Mettre le texte en italique
  },

  iconButton: {
    position: "relative", // Nécessaire pour superposer les éléments
    borderRadius: 10,
    width: 55, // Dimensions fixes pour le bouton (modifiez selon vos besoins)
    height: 55,
    overflow: "hidden", // Assurez-vous que les enfants ne débordent pas
  },
  iconButtonBackground: {
    ...StyleSheet.absoluteFillObject, // Prend tout l'espace du bouton
    backgroundColor: "#fff",
    opacity: 0.5, // Opacité appliquée uniquement au fond
    borderRadius: 10, // Coins arrondis pour le fond
  },
  iconButtonContent: {
    flex: 1, // Remplit l'espace restant
    flexDirection: "row", // Positionne les icônes côte à côte
    alignItems: "center", // Centrage vertical
    justifyContent: "center", // Centrage horizontal
  },
  panier: {
    fontSize: 30,
    color: "#000", // Couleur noire pour le caddy
    marginRight: 5, // Espace entre le caddy et le bouton rouge
  },
  iconMoreOrLess: {
    fontSize: 15,
    color: "#fff",
    backgroundColor: "red", // Fond rouge pour le bouton + ou -
    width: 20,
    height: 20,
    borderRadius: 10, // Cercle parfait
    textAlign: "center", // Centrage horizontal
    lineHeight: 20, // Centrage vertical
    bottom: 15,
    marginLeft: -20, // Ajustement pour chevauchement
  },
});
