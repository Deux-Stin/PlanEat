import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
// import useStorageRecipes from '../hooks/useStorageRecipes.old';
import uuid from 'react-native-uuid';
import ImageBackgroundWrapper from '../components/ImageBackgroundWrapper'; // Import du wrapper

export default function ({ route, navigation }) {
  const { addRecipe } = route.params; // Récupérer la fonction addRecipe
  const [recipes, setRecipes] = useAsyncStorage('recipes', []);
  const [newRecipe, setNewRecipe] = useState({
    id: '',
    name: '',
    source: '',
    category: '',
    duration: 'court',
    season: ['printemps', 'été', 'automne', 'hiver'],
    servings: '',
    ingredients: [],
    recipe: [],
    nutritionalValues: {
      glucides: '',
      proteines: '',
      graisses: ''
    }
  });

  // Edition des ingrédients et des étapes des recettes
  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null);
  const [editedIngredient, setEditedIngredient] = useState(null);
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [editedStep, setEditedStep] = useState('');



  // Définir des couleurs pour chaque saison
  const seasonColors = {
    printemps: '#E6F3CE', // Exemple de couleur pour le printemps
    été: '#FFDFBA', // Exemple de couleur pour l'été
    automne: '#FFFFBA', // Exemple de couleur pour l'automne
    hiver: '#BAE1FF', // Exemple de couleur pour l'hiver
    default: '#ccc', // Couleur grise pour les saisons non sélectionnées
  };

  useEffect(() => {
    if (route.params?.recipe) {
      setNewRecipe((prev) => ({
        ...prev,
        ...route.params.recipe,
        servings: route.params.recipe.servings || '', // Valeur par défaut si non définie
      }));
    }
  }, [route.params?.recipe]);
  

  const [ingredientInput, setIngredientInput] = useState({
    name: '',
    quantity: '',
    unit: 'unité', // Unité par défaut
    rayon: 'Divers' // Rayon par défaut
  });

  const [stepInput, setStepInput] = useState('');

  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [rayonModalVisible, setRayonModalVisible] = useState(false);

  const availableCategories = ['Apéritif','Petit-déjeuner', 'Entrée', 'Plat', 'Dessert', 'Cocktail'];
  const availableDuration = ['court', 'long'];
  const availableSeasons = ['printemps', 'été', 'automne', 'hiver'];
  const availableUnits = ['unité', 'g', 'kg', 'ml', 'L', 'c. à café', 'c. à soupe', 'boîte', 'verre', 'gousse(s)'];
  const availableRayons = ['Divers', ,'Alcool', 'Condiments', 'Pâtes', 'Produits frais', 'Herbes aromatiques', 'Fromages', 'Boucherie', 'Poissonnerie', 'Boulangerie', 'Épicerie', 'Fruits et légumes', 'Fruits secs et mélanges', 'Surgelés', 'Conserves', 'Produits laitiers, oeufs', 'Boissons', 'Hygiène', 'Entretien'].sort((a, b) => a.localeCompare(b)); // Trie le tableau par ordre alphabétique
  
  const toggleDuration = (duration) => {
    setNewRecipe((prev) => ({
      ...prev,
      duration: prev.duration === duration ? '' : duration, // Si la durée est déjà sélectionnée, la désélectionner, sinon l'ajouter
    }));
  };


  const toggleSeason = (season) => {
    setNewRecipe((prev) => {
      const currentSeasons = prev.season.includes(season)
        ? prev.season.filter((s) => s !== season) // Retire la saison s'il est déjà sélectionnée
        : [...prev.season, season]; // Ajoute la saison s'il n'est pas sélectionnée
      return { ...prev, season: currentSeasons };
    });
  };

  const toggleCategory = (category) => {
    setNewRecipe((prev) => ({
      ...prev,
      category: prev.category === category ? '' : category, // Si la catégorie est déjà sélectionnée, la désélectionner, sinon l'ajouter
    }));
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
      setIngredientInput({ name: '', quantity: '', unit: 'unité', rayon: 'Divers' }); // Réinitialisation des champs
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

  const handleSubmit = async () => {

    if (!newRecipe.source.trim()) {
      // Définit "Internet" si l'utilisateur n'a rien entré
      setNewRecipe({ ...newRecipe, source: 'Internet' });
    }
    const { name, source, category, duration, season, servings, ingredients, recipe, nutritionalValues } = newRecipe;

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
      id: route.params?.recipe ? newRecipe.id : uuid.v4(), // Utiliser l'ID existant si on modifie
      name,
      source,
      category,
      duration: duration,
      season: season,
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

    // Vérifier si la recette est déjà dans la liste
    const existingRecipeIndex = recipes.findIndex(r => r.id === recipeData.id);

    let updatedRecipes;
    if (existingRecipeIndex !== -1) {
      // Si elle existe, on met à jour
      updatedRecipes = recipes.map(r => r.id === recipeData.id ? recipeData : r);
    } else {
      // Sinon, on ajoute la nouvelle recette
      recipeData.id = uuid.v4();  // Si l'ID est vide, c'est une nouvelle recette
      updatedRecipes = [...recipes, recipeData];
    }

    try {
      // updatedRecipes = [...recipes, recipeData];
      await setRecipes(updatedRecipes); // mettre à jour le useAsyncStorage
      console.log("recipeData : ", recipeData)
      // console.log("recipes : ", recipes)
      Alert.alert('Succès', `Recette ${existingRecipeIndex !== -1 ? 'modifiée' : 'ajoutée'} avec succès!`);

      if (typeof addRecipe !== 'function') {
        // console.log('addRecipe is not a function');
        // return;
      } else {
        addRecipe(recipeData); // Appelle la fonction pour ajouter la recette
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des recettes :', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la mise à jour des recettes.');
    }

    navigation.navigate('RecipeLibrary');
  };

  return (
    <ImageBackgroundWrapper imageOpacity={0.3}>
      <ScrollView style={styles.container}>
        {/* <Text style={styles.header}>Ajouter une nouvelle recette</Text> */}

        <TextInput
          placeholder="Nom de la recette"
          value={newRecipe.name}
          onChangeText={(text) => setNewRecipe({ ...newRecipe, name: text })}
          style={styles.input}
        />

        <View style={styles.categoryContainer}>
          <Text style={styles.label}></Text>
          <View style={styles.checkboxContainer}>
            {availableCategories.map((category, index) => (
              <View key={index} style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>{category}</Text>
                <Checkbox
                  status={newRecipe.category.includes(category) ? 'checked' : 'unchecked'}
                  onPress={() => toggleCategory(category)}
                />
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Durée de la recette</Text>
        <View style={styles.flexContainer}>
          {availableDuration.map((duration) => (
            <TouchableOpacity
              key={duration}
              onPress={() => toggleDuration(duration)}
              style={[
                styles.durationButton,
                newRecipe.duration.includes(duration) ? styles.selectedDurationButton : styles.unselectedDurationButton]}
            >
              <Text style={styles.pickerButtonText}>{duration}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 5, marginBottom: 5}]}>Source</Text>
        <TextInput
          placeholder="Ex: Internet"
          value={newRecipe.source}
          onChangeText={(text) => setNewRecipe({ ...newRecipe, source: text })}
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Saison</Text>
        <View style={styles.flexContainer}>
          {availableSeasons.map((season) => (
            <TouchableOpacity
              key={season}
              onPress={() => toggleSeason(season)}
              style={[
                styles.durationButton,
                newRecipe.season.includes(season) ? styles.selectedDurationButton : styles.unselectedDurationButton, // Appliquer le style en fonction de la sélection
                { backgroundColor: newRecipe.season.includes(season) ? seasonColors[season] : '#ccc' } // Couleur grise si non sélectionné
              ]}
            >
              <Text style={styles.pickerButtonText}>{season}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Portions</Text>
        <View style={styles.somespace} />
        <TextInput
          placeholder="Nombre de parts"
          value={newRecipe.servings?.toString() || ''} // Convertir en chaîne ou afficher une chaîne vide
          onChangeText={(text) => {
            if (text === '') {
              // Si l'utilisateur efface tout, mettre une valeur vide
              setNewRecipe({ ...newRecipe, servings: '' });
            } else {
              const numericValue = parseInt(text, 10);
              if (!isNaN(numericValue) && numericValue > 0) {
                setNewRecipe({ ...newRecipe, servings: numericValue });
              }
            }
          }}
          keyboardType="numeric"
          style={styles.input}
        />


        <Text style={styles.sectionTitle}>Ingrédients</Text>
        <View style={styles.somespace} />
          {newRecipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.itemContainer}>
              {editingIngredientIndex === index ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={editedIngredient?.name || ''}
                    onChangeText={(text) => setEditedIngredient({ ...editedIngredient, name: text })}
                    placeholder="Nom de l'ingrédient"
                  />
                  <TextInput
                    style={styles.input}
                    value={editedIngredient?.quantity.toString() || ''}
                    onChangeText={(text) => setEditedIngredient({ ...editedIngredient, quantity: parseFloat(text) || '' })}
                    keyboardType="numeric"
                    placeholder="Quantité"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const updatedIngredients = [...newRecipe.ingredients];
                      updatedIngredients[index] = editedIngredient;
                      setNewRecipe({ ...newRecipe, ingredients: updatedIngredients });
                      setEditingIngredientIndex(null);
                    }}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>Sauvegarder</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.itemText} onPress={() => {
                    setEditingIngredientIndex(index);
                    setEditedIngredient(ingredient);
                  }}>
                    {ingredient.name} - {ingredient.quantity} {ingredient.unit} ({ingredient.rayon})
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveIngredient(index)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </>
              )}
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

        <TouchableOpacity style={styles.mainButtonStep} onPress={handleAddIngredient}>
          <Text style={styles.mainButtonText}>Ajouter ingrédient</Text>
        </TouchableOpacity>


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
              <TouchableOpacity style={styles.mainButtonStep} onPress={() => setUnitModalVisible(false)}>
                <Text style={styles.mainButtonText}>Fermer</Text>
              </TouchableOpacity>
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
              <TouchableOpacity style={styles.mainButtonStep} onPress={() => setRayonModalVisible(false)}>
                <Text style={styles.mainButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


        <View style={styles.somespace} />
        <View style={styles.somespace} />
        <Text style={styles.sectionTitle}>Étapes de la recette</Text>
        <View style={styles.somespace} />

        {newRecipe.recipe.map((step, index) => (
          <View key={index} style={styles.itemContainer}>
            {editingStepIndex === index ? (
              <>
                <TextInput
                  style={styles.input}
                  value={editedStep}
                  onChangeText={setEditedStep}
                  placeholder="Modifier l'étape"
                />
                <TouchableOpacity
                  onPress={() => {
                    const updatedSteps = [...newRecipe.recipe];
                    updatedSteps[index] = editedStep;
                    setNewRecipe({ ...newRecipe, recipe: updatedSteps });
                    setEditingStepIndex(null);
                  }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text
                style={styles.itemText}
                onPress={() => {
                  setEditingStepIndex(index);
                  setEditedStep(step);
                }}
              >
                {index + 1}: {step}
              </Text>
            )}
            <TouchableOpacity onPress={() => handleRemoveStep(index)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))}




        {/* {newRecipe.recipe.map((step, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text style={styles.itemText}>{index + 1}: {step}</Text>
            <TouchableOpacity onPress={() => handleRemoveStep(index)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))} */}

        <TextInput
          placeholder="Ajouter une étape"
          value={stepInput}
          onChangeText={(text) => setStepInput(text)}
          style={styles.input}
        />
        <TouchableOpacity style={styles.mainButtonStep} onPress={handleAddStep}>
          <Text style={styles.mainButtonText}>Ajouter étape</Text>
        </TouchableOpacity>

        <View style={styles.somespace} />
        <Text style={styles.sectionTitle}>Valeurs nutritionnelles pour 100g (optionnel)</Text>
        <View style={styles.somespace} />
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
        <TextInput
          placeholder="kCal (ex: 400 kCal)"
          value={newRecipe.nutritionalValues.kiloCalories}
          onChangeText={(text) => setNewRecipe({ ...newRecipe, nutritionalValues: { ...newRecipe.nutritionalValues, kiloCalories: text } })}
          style={styles.input}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleSubmit}>
            <Text style={styles.mainButtonText}>Ajouter la recette</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('RecipeLibrary')}>
            <Text style={styles.mainButtonText}>Retour à la bibliothèque</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  unselectedDurationButton: {
    opacity: 0.5, // Optionnel : rendre le bouton légèrement transparent
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
  flexContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  durationButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    flexBasis: '48%', // Pour avoir deux boutons par ligne
    alignItems: 'center',
  },
  selectedDurationButton: {
    backgroundColor: '#FCE7E8', // Couleur de fond pour les éléments sélectionnés
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
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
    marginVertical: 5,
    // marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',

    marginTop: 20,
    // marginBottom: 20,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
    paddingBottom: 5,
    // textAlign: 'center', // A voir si l'aspect centré plait plus

  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'flex-start',
    marginTop: 5,
    marginBottom: 15,
  },
  checkboxContainer: {
    backgroundColor: '#eeeeee',
    flexDirection: 'row', // Alignement horizontal
    borderRadius: 5,
    flex: 1, // Prend tout l'espace disponible
    justifyContent: 'space-evenly', // Espace entre chaque checkbox
    marginLeft: 0, // Espace entre le label et les checkboxes

    elevation: 10,
  },
  checkboxItem: {
    flexDirection: 'column', // Aligne chaque checkbox avec son texte
    alignItems: 'center', // Centre les checkbox et le texte
  },
  checkboxLabel: {
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap', // Ajout de flexWrap
  },
  itemText: {
    fontSize: 16,
    flex: 1, // Ajout de flex: 1 pour prendre tout l'espace
    marginRight: 5, // Ajout d'une marge à droite pour séparer le texte du bouton
    padding:5,
  },
  removeButton: {
    backgroundColor: '#ff3333',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#29ff6a',
    padding: 5,
    borderRadius: 5,
  },
  saveButtonText: {
    color: 'white',
  },
  buttonContainer: {
    marginTop: 10,
    paddingBottom: 40,
  },
  mainButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    width: '100%',
  },
  mainButtonStep: {
    backgroundColor: '#5baaff',
    padding: 10,
    borderRadius: 20,
    marginVertical: 2.5,
    alignItems: 'center',
    width: '100%',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  somespace: {
    height: 5,
  },
});
