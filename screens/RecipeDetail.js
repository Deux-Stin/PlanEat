import React from 'react';
import { ScrollView, Text, Button, Alert, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useAsyncStorage } from '../hooks/useAsyncStorage';

export default function RecipeDetail({ route, navigation }) {
  const { recipe, addRecipe, deleteRecipe } = route.params;

  // Utiliser useAsyncStorage pour obtenir les recettes
  const [storedRecipes, setStoredRecipes] = useAsyncStorage('recipes', []);

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
              await deleteRecipe(recipe);
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
    navigation.navigate('AddRecipe', {
      recipe,
      addRecipe: addRecipe
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête avec le titre */}
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>
      </View>

      {/* Section Détails de la recette */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails de la recette</Text>
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Catégorie: </Text>
          {recipe.category || "Non spécifié"}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type: </Text>
          {Array.isArray(recipe.type) ? recipe.type.join(', ') : "Non spécifié"}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Saison: </Text>
          {recipe.season || "Non spécifié"}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Nombre de parts: </Text>
          {recipe.servings || "Non spécifié"}
        </Text>
      </View>

      {/* Section Ingrédients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingrédients</Text>
        {recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.itemText}>
              - {ingredient.name}: {ingredient.quantity} {ingredient.unit} ({ingredient.rayon})
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
            <Text key={index} style={styles.itemText}>
              {index + 1}. {step}
            </Text>
          ))
        ) : (
          <Text style={styles.itemText}>Aucune étape spécifiée</Text>
        )}
      </View>

      {/* Section Valeurs nutritionnelles */}
      <View style={styles.nutritionalSection}>
        <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
        <View style={styles.nutritionalRow}>
          <Text style={styles.itemText}>Glucides: {recipe.nutritionalValues?.glucides || "Non spécifié"}</Text>
          <Text style={styles.itemText}>Protéines: {recipe.nutritionalValues?.proteines || "Non spécifié"}</Text>
          <Text style={styles.itemText}>Graisses: {recipe.nutritionalValues?.graisses || "Non spécifié"}</Text>
        </View>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center', // Centrer horizontalement
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Centrer le texte du titre
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
    width: '100%', // Prendre toute la largeur disponible
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
    width: '100%', // Occupe toute la largeur disponible
  },
  nutritionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Espacement égal entre les éléments
    alignItems: 'center',
    marginTop: 10,
  },
  itemText: {
    fontSize: 16,
    textAlign: 'center', // Pour centrer le texte verticalement
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
    marginTop: 20,
  },
  buttonWrapper: {
    backgroundColor: '#007bff', // Couleur de fond du bouton
    padding: 15,
    marginVertical: 5,
    marginRight: 8,
    borderRadius: 10, // Border radius appliqué ici
    flexBasis: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff', // Couleur du texte
    fontSize: 16,
  },
});
