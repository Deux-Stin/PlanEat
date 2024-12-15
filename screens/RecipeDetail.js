import React from 'react';
import { ScrollView, Text, Button, Image, Alert, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import ImageBackgroundWrapper from '../components/ImageBackgroundWrapper'; // Import du wrapper
import { globalStyles } from "../globalStyles";

export default function RecipeDetail({ route, navigation }) {
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage('backgroundIndex', 0); //Recupère l'index du background

  const { recipe } = route.params; //, addRecipe, deleteRecipe 

  // Utiliser useAsyncStorage pour obtenir les recettes
  const [storedRecipes, setStoredRecipes] = useAsyncStorage('recipes', []);
  const [mealChoice, setMealChoice] = useAsyncStorage('mealChoice', []);

  const addToMealChoice = () => {
    setMealChoice((prevMealChoice) => {
        const updatedMealChoice = [...prevMealChoice, recipe];

        const recipeNames = updatedMealChoice.map((recipe) => recipe.name);
        console.log('Liste des noms des recettes choisies :', recipeNames);
        
        return updatedMealChoice;
    });
    // alert('Recette ajoutée à votre sélection !');
    navigation.goBack()
};

  const handleDelete = async () => {
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer la recette ${recipe.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              const updatedRecipes = storedRecipes.filter(r => r.name !== recipe.name);
              await setStoredRecipes(updatedRecipes);
              // await deleteRecipe(recipe);
              navigation.navigate('RecipeLibrary', { refresh: true });
            } catch (error) {
              console.error('Erreur lors de la suppression de la recette :', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    console.log('recipe : ', recipe)
    navigation.navigate('AddRecipe', {
      recipe,
      // addRecipe: addRecipe
    });
  };

  return (
    <ImageBackgroundWrapper
      backgroundIndex={backgroundIndex}
      imageOpacity={0.5}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* En-tête avec le titre */}
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.name}</Text>
        </View>

        {/* Affichage de l'image de la recette */}
        {recipe.image ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: recipe.image }}
              style={styles.imageWithBorder}
            />
          </View>
        ) : (
          <Text style={{ textAlign: "center" }}></Text>
        )}

        {/* Section Détails de la recette */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la recette</Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Catégorie : </Text>
            {recipe.category.charAt(0).toUpperCase() +
              recipe.category.slice(1) || "Non spécifié"}
          </Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée : </Text>
            {recipe.duration.charAt(0).toUpperCase() +
              recipe.duration.slice(1) || "Non spécifié"}
          </Text>
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Source: </Text>
            {recipe.source.charAt(0).toUpperCase() + recipe.source.slice(1) ||
              "Non spécifié"}
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
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.itemText}>
                -{" "}
                <Text>
                  {ingredient.name.charAt(0).toUpperCase() +
                    ingredient.name.slice(1)}
                </Text>{" "}
                : {ingredient.quantity} {ingredient.unit}
              </Text>
            ))
          ) : (
            <Text style={styles.itemText}>Aucun ingrédient spécifié</Text>
          )}
        </View>

        {/* Section Recette */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étapes de la Recette</Text>
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
        {((recipe.nutritionalValues?.glucides &&
          recipe.nutritionalValues?.glucides !== "0") ||
          (recipe.nutritionalValues?.proteines &&
            recipe.nutritionalValues?.proteines !== "0") ||
          (recipe.nutritionalValues?.graisses &&
            recipe.nutritionalValues?.graisses !== "0") ||
          (recipe.nutritionalValues?.kiloCalories &&
            recipe.nutritionalValues?.kiloCalories !== "0")) && (
          <View style={styles.nutritionalSection}>
            <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>

            {/* Ligne pour Glucides et Protéines */}
            <View style={styles.nutritionalRow}>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>Glucides:</Text>
                <Text style={styles.itemValue}>
                  {recipe.nutritionalValues?.glucides || "Non spécifié"}
                </Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>Protéines:</Text>
                <Text style={styles.itemValue}>
                  {recipe.nutritionalValues?.proteines || "Non spécifié"}
                </Text>
              </View>
            </View>

            {/* Ligne pour Graisses et kCalories */}
            <View style={styles.nutritionalRow}>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>Graisses:</Text>
                <Text style={styles.itemValue}>
                  {recipe.nutritionalValues?.graisses || "Non spécifié"}
                </Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Text style={styles.itemLabel}>kCal:</Text>
                <Text style={styles.itemValue}>
                  {recipe.nutritionalValues?.kiloCalories || "Non spécifié"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bouton d'ajout au "panier"*/}
        <TouchableOpacity style={styles.mainButton} onPress={addToMealChoice}>
          <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>
            Ajouter à mon 🛒
          </Text>
        </TouchableOpacity>

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
    padding: 20,
    // backgroundColor: '#fff',
    alignItems: 'center', // Centrer horizontalement
  },
  header: {
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Centrer le texte du titre
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
    width: '80%', // Prendre toute la largeur disponible
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    textAlign: 'center', // Centrer le texte des sections
  },
  nutritionalSection: {
    marginBottom: 20,
    width: '70%',
  },
  nutritionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Répartit uniformément les éléments sur chaque ligne
    alignItems: 'center',
    marginVertical: 5, // Espace entre chaque ligne
  },
  nutritionalItem: {
    width: '45%', // Assure que chaque élément occupe la moitié de la ligne
    flexDirection: 'row',
    justifyContent: 'flex-start', // Alignement à gauche pour l’étiquette
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 16,
    textAlign: 'right', // Aligne les labels à droite
    paddingRight: 5, // Espace entre le label et la valeur
  },
  itemValue: {
    fontSize: 16,
    textAlign: 'left', // Aligne les valeurs à gauche de leur propre cellule
  },  
  detailItem: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center', // Centrer le texte des détails
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center', // Centrer le texte des ingrédients et étapes
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    // marginTop: 20,
  },
  buttonWrapper: {
    backgroundColor: '#fff',
    opacity: 0.8,
    padding: 15,
    marginVertical: 5,
    marginRight: 8,
    borderRadius: 10, // Border radius appliqué ici
    flexBasis: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000', // Couleur du texte
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
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 30,
  },
  imageWithBorder: {
    width: 300,
    height: 300,
    borderWidth: 2.5,
    borderColor: '#FFFFFF', // Bordure blanche
    borderRadius: 50, // Coins arrondis plus extrêmes
    padding: 5, // L'espace entre l'image et la bordure
    backgroundColor: '#f4f4f4', // Couleur d'arrière-plan neutre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5, // Ombre sur Android
    overflow: 'hidden', // Important pour garder les coins arrondis
  },
  italicText:{
    fontStyle: 'italic', // Mettre le texte en italique
  },  
});
