import React from 'react';
import { ScrollView, Text, Button, Alert, StyleSheet } from 'react-native';
import { useAsyncStorage } from '../hooks/useAsyncStorage';

export default function RecipeDetail({ route, navigation }) {
  const { recipe, deleteRecipe } = route.params;
  
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
              // Filtrer la recette à supprimer
              // console.log("storedRecipes :", storedRecipes)
              const updatedRecipes = storedRecipes.filter(r => r.name !== recipe.name);
              console.log("Update recipes after delete : ", updatedRecipes);
              
              // Sauvegarder les recettes mises à jour
              await setStoredRecipes(updatedRecipes);

              await deleteRecipe(recipe); // Appelle deleteRecipe pour supprimer la recette
              
              // Naviguer directement vers RecipeLibrary (pour forcer la mise à jour)
              navigation.navigate('RecipeLibrary', { refresh: true}); // Passer une prop pour rafraîchir
            } catch (error) {
              console.error('Erreur lors de la suppression de la recette :', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddRecipe', { recipe });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.category}>Catégorie: {recipe.category}</Text>
      <Text style={styles.servings}>Nombre de parts: {recipe.servings}</Text>

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      {recipe.ingredients.map((ingredient, index) => (
        <Text key={index} style={styles.itemText}>
          - {ingredient.name}: {ingredient.quantity} {ingredient.unit} ({ingredient.rayon})
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Recette</Text>
      {recipe.recipe.map((step, index) => (
        <Text key={index} style={styles.itemText}>
          {index + 1}. {step}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
      <Text style={styles.itemText}>Glucides: {recipe.nutritionalValues.glucides}</Text>
      <Text style={styles.itemText}>Protéines: {recipe.nutritionalValues.proteines}</Text>
      <Text style={styles.itemText}>Graisses: {recipe.nutritionalValues.graisses}</Text>

      <Button title="Modifier" onPress={handleEdit} />
      <Button title="Supprimer" onPress={handleDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  category: {
    fontSize: 16,
    marginBottom: 5,
  },
  servings: {
    fontSize: 16,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
});
