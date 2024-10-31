import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { Button, Checkbox } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import moment from 'moment';

export default function ShoppingListScreen({ navigation, route}) {
  const [mealPlan] = useAsyncStorage('mealPlan', {});
  const [shoppingHistory, setShoppingHistory] = useAsyncStorage('shoppingHistory', []);
  const [shoppingList, setShoppingList] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [manualItem, setManualItem] = useState('');

  useEffect(() => {
    console.log('Meal Plan:', mealPlan);
    // Réinitialisez la liste de courses et les éléments cochés lorsque mealPlan change
    setShoppingList({});
    // setCheckedItems({});
    getShoppingList(); // Appel ici
  }, [mealPlan]);

  useEffect(() => {
    // console.log('Shopping List:', shoppingList);
  }, [shoppingList]);

  useEffect(() => {
    // Charger l'historique ou une nouvelle liste
    if (route.params?.historyItem) {
      const previousList = route.params.historyItem.ingredients || {};
      setShoppingList(previousList);
    } else {
      // getShoppingList();
    }
  }, [route.params?.historyItem]);

  const cleanMealPlan = (mealPlan) => {
    const cleanedPlan = {};
  
    Object.keys(mealPlan).forEach(date => {
      const meals = mealPlan[date];
      const cleanedMeals = {};
  
      // Nettoie les types de repas (par exemple, si un repas est nul, ne l'inclut pas)
      Object.keys(meals).forEach(mealType => {
        const recipe = meals[mealType];
  
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          cleanedMeals[mealType] = recipe;
        }
      });
  
      // Si après nettoyage, un jour a encore des repas valides, on l'ajoute
      if (Object.keys(cleanedMeals).length > 0) {
        cleanedPlan[date] = cleanedMeals;
      }
    });
  
    return cleanedPlan;
  };
  
    
  const getShoppingList = () => {
    const cleanedPlan = cleanMealPlan(mealPlan); // Utiliser le plan nettoyé
  
    if (Object.keys(cleanedPlan).length === 0) {
      setShoppingList({});
      return;
    }
  
    // Récupérer et combiner les ingrédients des recettes
    const ingredientsList = {};
  
    Object.entries(cleanedPlan).forEach(([date, meals]) => {
      Object.entries(meals).forEach(([mealType, recipe]) => {
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.forEach(ingredient => {
            const { name, quantity, unit, rayon } = ingredient;
  
            if (!ingredientsList[rayon]) {
              ingredientsList[rayon] = [];
            }
  
            const existingIngredient = ingredientsList[rayon].find(item => item.name === name);
            if (existingIngredient) {
              existingIngredient.quantity += quantity;
            } else {
              ingredientsList[rayon].push({ name, quantity, unit });
            }
          });
        }
      });
    });
  
    setShoppingList(ingredientsList);
  };
  
  
  // const handleGenerateShoppingList = () => {
  //   // Génération d'une nouvelle liste de courses en fonction des repas sélectionnés
  //   const newShoppingList = calculateShoppingListFromMealPlan(mealPlan);
  
  //   // Sauvegarde de la nouvelle liste de courses dans l'AsyncStorage
  //   handleSaveShoppingList(newShoppingList);
  // };

  const handleSaveShoppingList = (newShoppingList) => {
    const newHistoryEntry = {
      date: moment().format('DD/MM/YYYY HH:mm'),
      ingredients: newShoppingList, // Renommez 'list' en 'ingredients' pour correspondre à votre utilisation
    };
  
    // Ajouter à l'historique
    setShoppingHistory((prevHistory) => {
      const updatedHistory = [newHistoryEntry, ...prevHistory.slice(0, 9)];
      return updatedHistory;
    });

    // Réinitialiser l'état de la liste après la sauvegarde
    setShoppingList({}); // Réinitialiser ou vider la liste courante
  };
  

  const addManualItem = () => {
    if (manualItem.trim() === '') {
      Alert.alert('Erreur', 'Veuillez entrer un élément valide.');
      return;
    }

    const newItem = {
      name: manualItem,
      quantity: 1,
      unit: 'unité',
      rayon: 'Divers'
    };

    setShoppingList((prevList) => {
      const updatedList = { ...prevList };
      if (!updatedList['Divers']) {
        updatedList['Divers'] = [];
      }
      updatedList['Divers'].push(newItem);
      return updatedList;
    });

    setManualItem('');
  };

  const handleCopy = () => {
    const listText = Object.keys(shoppingList).map(rayon =>
      `${rayon}:\n` + shoppingList[rayon].map(item => `${item.name}: ${item.quantity} ${item.unit}`).join('\n')
    ).join('\n\n');

    Clipboard.setStringAsync(listText)
      .then(() => {
        Alert.alert('Liste copiée', 'La liste a été copiée dans le presse-papiers.');
      })
      .catch(err => {
        Alert.alert('Erreur', 'Erreur lors de la copie dans le presse-papiers.');
      });
  };

  const handleReset = () => {
    setCheckedItems({});
    setManualItem('');
    setShoppingList({});  // Réinitialise complètement la liste
    getShoppingList(); // Réinitialise complètement la liste
  };

  const incrementQuantity = (rayon, name, increment) => {
    setShoppingList(prevList => {
      const updatedList = { ...prevList };
      const ingredient = updatedList[rayon].find(item => item.name === name);
      if (ingredient) {
        ingredient.quantity += increment;
      }
      return updatedList;
    });
  };

  const decrementQuantity = (rayon, name, decrement) => {
    setShoppingList(prevList => {
      const updatedList = { ...prevList };
      const ingredient = updatedList[rayon].find(item => item.name === name);
      if (ingredient) {
        if (ingredient.quantity > decrement) {
          ingredient.quantity -= decrement;
        } else {
          // Supprimer l'ingrédient si la quantité devient 0 ou moins
          updatedList[rayon] = updatedList[rayon].filter(item => item.name !== name);
        }
      }
      return updatedList;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.header}>Liste de courses</Text>

        {Object.keys(shoppingList).length === 0 ? (
          <Text>Aucune liste de courses générée.</Text>
        ) : (
          Object.keys(shoppingList).map((rayon) => (
            <View key={rayon} style={styles.rayonSection}>
              <Text style={styles.rayonHeader}>{rayon}</Text>
              {shoppingList[rayon].map((ingredient) => (
                <View key={ingredient.name} style={styles.ingredientRow}>
                  <Checkbox
                    status={checkedItems[ingredient.name] ? 'checked' : 'unchecked'}
                    onPress={() => setCheckedItems({
                      ...checkedItems,
                      [ingredient.name]: !checkedItems[ingredient.name]
                    })}
                  />
                  <Text style={styles.ingredientText}>
                    {ingredient.name} - {ingredient.quantity} {ingredient.unit}
                  </Text>
                  <View style={styles.buttonGroup}>
                    <Button onPress={() => decrementQuantity(rayon, ingredient.name, ingredient.unit === 'g' ? 10 : 1)}>
                      -
                    </Button>
                    <Button onPress={() => incrementQuantity(rayon, ingredient.name, ingredient.unit === 'g' ? 10 : 1)}>
                      +
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        {/* Champ pour ajouter des éléments manuels */}
        <TextInput
          placeholder="Ajouter un nouvel élément"
          value={manualItem}
          onChangeText={setManualItem}
          style={styles.input}
        />
        <Button mode="contained" onPress={addManualItem} style={styles.addButton}>
          Ajouter à la liste
        </Button>
      </ScrollView>

      {/* Boutons Reset et Copier */}
      <View style={styles.actionButtons}>
        <Button mode="contained" onPress={handleReset} style={styles.actionButton}>
          Reset
        </Button>
        <Button mode="contained" onPress={() => handleSaveShoppingList(shoppingList)} style={styles.actionButton}>
          Save
        </Button>
        <Button mode="contained" onPress={handleCopy} style={styles.actionButton}>
          Copier
        </Button>
      </View>

      <Button mode="contained" onPress={() => navigation.navigate('MealPlanScreen')} style={styles.backButton}>
        Retour à la planification
      </Button>
    </View>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  rayonSection: {
    marginVertical: 20,
  },
  rayonHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  backButton: {
    marginTop: 20,
  },
});
