import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
// import useStorageRecipes from '../hooks/useStorageRecipes.old';
import uuid from 'react-native-uuid';

export default function AddRecipe({ route, navigation }) {
  const { addRecipe } = route.params; // Récupérer la fonction addRecipe
  const [recipes, setRecipes] = useAsyncStorage('recipes', []);
  const [newRecipe, setNewRecipe] = useState({
    id: '',
    name: '',
    category: [],
    servings: '',
    ingredients: [],
    recipe: [],
    nutritionalValues: {
      glucides: '',
      proteines: '',
      graisses: ''
    }
  });

  const [ingredientInput, setIngredientInput] = useState({
    name: '',
    quantity: '',
    unit: 'unité', // Unité par défaut
    rayon: 'Produits frais' // Rayon par défaut
  });

  const [stepInput, setStepInput] = useState('');

  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [rayonModalVisible, setRayonModalVisible] = useState(false);

  const availableCategories = ['Petit-déjeuner', 'Déjeuner', 'Dîner'];
  const availableUnits = ['unité', 'g', 'kg', 'ml', 'L', 'petite cuillère', 'grande cuillère'];
  const availableRayons = ['Produits frais', 'Boucherie', 'Poissonnerie', 'Boulangerie', 'Épicerie', 'Fruits et légumes', 'Surgelés', 'Produits laitiers', 'Boissons', 'Hygiène', 'Entretien'];

  const toggleCategory = (category) => {
    if (newRecipe.category.includes(category)) {
      setNewRecipe({
        ...newRecipe,
        category: newRecipe.category.filter((c) => c !== category)
      });
    } else {
      setNewRecipe({
        ...newRecipe,
        category: [...newRecipe.category, category]
      });
    }
  };

  const handleAddIngredient = () => {
    const { name, quantity, unit, rayon } = ingredientInput;
    if (name && quantity && unit && rayon) {
      const parsedQuantity = parseFloat(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        Alert.alert('Erreur', 'Veuillez entrer une quantité valide.');
        return;
      }

      setNewRecipe({
        ...newRecipe,
        ingredients: [...newRecipe.ingredients, { name, quantity: parsedQuantity, unit, rayon }]
      });
      setIngredientInput({ name: '', quantity: '', unit: 'unité', rayon: 'Produits frais' }); // Réinitialisation des champs
    } else {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs de l\'ingrédient.');
    }
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = newRecipe.ingredients.filter((_, i) => i !== index);
    setNewRecipe({ ...newRecipe, ingredients: updatedIngredients });
  };

  const handleAddStep = () => {
    if (stepInput.trim()) {
      setNewRecipe({
        ...newRecipe,
        recipe: [...newRecipe.recipe, stepInput.trim()]
      });
      setStepInput('');
    } else {
      Alert.alert('Erreur', 'Veuillez entrer une étape de recette.');
    }
  };

  const handleRemoveStep = (index) => {
    const updatedSteps = newRecipe.recipe.filter((_, i) => i !== index);
    setNewRecipe({ ...newRecipe, recipe: updatedSteps });
  };

  const handleSubmit = () => {
    const { name, category, servings, ingredients, recipe, nutritionalValues } = newRecipe;

    if (!name || category.length === 0 || !servings || ingredients.length === 0 || recipe.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const parsedServings = parseInt(servings);
    if (isNaN(parsedServings) || parsedServings < 1) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de parts valide.');
      return;
    }

    const filledNutritionalValues = {
      glucides: nutritionalValues.glucides || '0',
      proteines: nutritionalValues.proteines || '0',
      graisses: nutritionalValues.graisses || '0'
    };

    const recipeData = {
      id: uuid.v4(),
      name,
      category,
      servings: parsedServings,
      ingredients,
      recipe,
      nutritionalValues: filledNutritionalValues
    };

    const recipeExists = recipes.some(recipe => recipe.name === name && recipe.id !== recipeData.id);

    if (recipeExists) {
      Alert.alert('Erreur', 'Une recette avec ce nom existe déjà.');
      return;
    }

    updatedRecipes = [...recipes, recipeData];
    setRecipes(updatedRecipes); // mettre à jour le useAsyncStorage
    console.log("recipeData : ", recipeData)
    // console.log("recipes : ", recipes)
    Alert.alert('Succès', 'Recette ajoutée avec succès!');

    // // Met à jour le fichier json stocké en local
    // useStorageRecipes(updatedRecipes);

    addRecipe(recipeData); // Appelle la fonction pour ajouter la recette
    navigation.navigate('RecipeLibrary');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Ajouter une nouvelle recette</Text>

      <TextInput
        placeholder="Nom de la recette"
        value={newRecipe.name}
        onChangeText={(text) => setNewRecipe({ ...newRecipe, name: text })}
        style={styles.input}
      />

      <View style={styles.categoryContainer}>
        <Text style={styles.label}>Catégorie :</Text>
        {availableCategories.map((category, index) => (
          <View key={index} style={styles.checkboxContainer}>
            <Checkbox
              status={newRecipe.category.includes(category) ? 'checked' : 'unchecked'}
              onPress={() => toggleCategory(category)}
            />
            <Text style={styles.checkboxLabel}>{category}</Text>
          </View>
        ))}
      </View>

      <TextInput
        placeholder="Nombre de parts"
        value={newRecipe.servings}
        onChangeText={(text) => setNewRecipe({ ...newRecipe, servings: text })}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.sectionTitle}>Ingrédients</Text>
      {newRecipe.ingredients.map((ingredient, index) => (
        <View key={index} style={styles.itemContainer}>
          <Text style={styles.itemText}>{ingredient.name} - {ingredient.quantity} {ingredient.unit} ({ingredient.rayon})</Text>
          <TouchableOpacity onPress={() => handleRemoveIngredient(index)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TextInput
        placeholder="Nom de l'ingrédient"
        value={ingredientInput.name}
        onChangeText={(text) => setIngredientInput({ ...ingredientInput, name: text })}
        style={styles.input}
      />
      
      <TextInput
        placeholder="Quantité"
        value={ingredientInput.quantity}
        onChangeText={(text) => setIngredientInput({ ...ingredientInput, quantity: text })}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Zone pour sélectionner l'unité */}
      <TouchableOpacity style={styles.pickerButton} onPress={() => setUnitModalVisible(true)}>
        <Text style={styles.pickerButtonText}>{ingredientInput.unit}</Text>
      </TouchableOpacity>

      {/* Zone pour sélectionner le rayon */}
      <TouchableOpacity style={styles.pickerButton} onPress={() => setRayonModalVisible(true)}>
        <Text style={styles.pickerButtonText}>{ingredientInput.rayon}</Text>
      </TouchableOpacity>

      <Button title="Ajouter ingrédient" onPress={handleAddIngredient} />

      {/* Modal pour sélectionner l'unité */}
      <Modal visible={unitModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir une unité</Text>
            {availableUnits.map((unit) => (
              <TouchableOpacity key={unit} onPress={() => {
                setIngredientInput({ ...ingredientInput, unit });
                setUnitModalVisible(false);
              }}>
                <Text style={styles.modalOption}>{unit}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Fermer" onPress={() => setUnitModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Modal pour sélectionner le rayon */}
      <Modal visible={rayonModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un rayon</Text>
            {availableRayons.map((rayon) => (
              <TouchableOpacity key={rayon} onPress={() => {
                setIngredientInput({ ...ingredientInput, rayon });
                setRayonModalVisible(false);
              }}>
                <Text style={styles.modalOption}>{rayon}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Fermer" onPress={() => setRayonModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>Étapes de la recette</Text>
      {newRecipe.recipe.map((step, index) => (
        <View key={index} style={styles.itemContainer}>
          <Text style={styles.itemText}>Étape {index + 1}: {step}</Text>
          <TouchableOpacity onPress={() => handleRemoveStep(index)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TextInput
        placeholder="Ajouter une étape"
        value={stepInput}
        onChangeText={(text) => setStepInput(text)}
        style={styles.input}
      />
      <Button title="Ajouter étape" onPress={handleAddStep} />

      <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
      <TextInput
        placeholder="Glucides (ex: 20g)"
        value={newRecipe.nutritionalValues.glucides}
        onChangeText={(text) => setNewRecipe({ ...newRecipe, nutritionalValues: { ...newRecipe.nutritionalValues, glucides: text } })}
        style={styles.input}
      />
      <TextInput
        placeholder="Protéines (ex: 30g)"
        value={newRecipe.nutritionalValues.proteines}
        onChangeText={(text) => setNewRecipe({ ...newRecipe, nutritionalValues: { ...newRecipe.nutritionalValues, proteines: text } })}
        style={styles.input}
      />
      <TextInput
        placeholder="Graisses (ex: 10g)"
        value={newRecipe.nutritionalValues.graisses}
        onChangeText={(text) => setNewRecipe({ ...newRecipe, nutritionalValues: { ...newRecipe.nutritionalValues, graisses: text } })}
        style={styles.input}
      />

      <View style={styles.buttonContainer}>
        <Button title="Ajouter la recette" onPress={handleSubmit} />
        <Button title="Retour à la bibliothèque" onPress={() => navigation.navigate('RecipeLibrary')} />
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  pickerButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalOption: {
    fontSize: 16,
    padding: 10,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#ff3333',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
  },
  buttonContainer: {
    marginTop: 20,
    paddingBottom: 40,
  },
});
