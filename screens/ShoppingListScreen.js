import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import ImageBackgroundWrapper from '../components/ImageBackgroundWrapper'; // Import du wrapper

export default function ShoppingListScreen({ navigation, route }) {
  const [shoppingList, setShoppingList] = useState({});
  const [mealPlanHistory, setMealPlanHistory] = useState([]);
  const [mealPlanHistorySaveAsync, setmealPlanHistorySaveAsync, getStoredValue] = useAsyncStorage('mealPlanHistory',[]);
  const [shoppingListReady, setShoppingListReady] = useState(false); // Nouvel état pour suivre l'état de shoppingList
  const [checkedItems, setCheckedItems] = useState({});
  const [manualItem, setManualItem] = useState('');
  const [newItemQuantity, setnewItemQuantity] = useState(''); // État pour la valeur numérique du modal d'unité
  const [showHideMenu, setShowHideMenu] = useState(false);
  const [hideCheckedItems, setHideCheckedItems] = useState(false);
  const { mealPlan } = route.params; // Recevoir le mealPlan à partir de la navigation
  const hasGeneratedShoppingList = useRef(false); // Utiliser useRef pour contrôler l'appel de la sauvegarde

  const availableUnits = ['unité', 'g', 'kg', 'ml', 'L', 'c. à café', 'c. à soupe', 'boîte', 'verre', 'gousse(s)'];
  const availableRayons = ['Divers', ,'Alcool', 'Condiments', 'Pâtes', 'Produits frais', 'Herbes aromatiques', 'Fromages', 'Boucherie', 'Poissonnerie', 'Boulangerie', 'Épicerie', 'Fruits et légumes', 'Fruits secs et mélanges', 'Surgelés', 'Conserves', 'Produits laitiers, oeufs', 'Boissons', 'Hygiène', 'Entretien'].sort((a, b) => a.localeCompare(b)); // Trie le tableau par ordre alphabétique
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [rayonModalVisible, setRayonModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('unité');
  const [selectedRayon, setSelectedRayon] = useState('Divers');

  
  useEffect(() => {
    // Charger l'historique au premier rendu
    loadMealPlanHistory();
    console.log('mealPlanHistory : ', mealPlanHistory)
    
    // Générer et sauvegarder la liste de courses une seule fois à l'arrivée sur la page
    if (mealPlan && !hasGeneratedShoppingList.current) {
      console.log("Génération et sauvegarde de la shopping list...");
      
      const ingredients = generateShoppingList(mealPlan);
      setShoppingList(ingredients);
  
      // Appeler handleSaveMealPlan une fois la liste générée
      handleSaveMealPlan();
      
      hasGeneratedShoppingList.current = true; // Empêcher la régénération et sauvegarde multiple
    }
  }, [mealPlanHistorySaveAsync]);
  
  
  useEffect(() => {
    const loadCheckedItems = async () => {
      try {
        const activeMealPlan = mealPlanHistory.find(
          (entry) => JSON.stringify(entry.mealPlan) === JSON.stringify(mealPlan)
        );

        if (activeMealPlan) {
          const savedCheckedItems = await AsyncStorage.getItem(`checkedItems_${activeMealPlan.date}`);
          setCheckedItems(savedCheckedItems ? JSON.parse(savedCheckedItems) : {});
        } else {
          setCheckedItems({});
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'état des éléments cochés", error);
      }
    };

    if (mealPlan) {
      loadCheckedItems();
    }
  }, [mealPlan, mealPlanHistory]);

  const toggleHideMenu = () => {
    setShowHideMenu(!showHideMenu);
  };

  const toggleHideCheckedItems = () => {
    setHideCheckedItems(!hideCheckedItems);
    setShowHideMenu(false); // Fermer le menu après sélection
  };

  const generateShoppingList = (mealPlan) => {
    const ingredientsList = {};

    Object.entries(mealPlan).forEach(([date, meals]) => {
      Object.entries(meals).forEach(([mealType, mealContent]) => {
        if (mealContent.ingredients) {
          const recipe = mealContent;
          const servingsSelected = recipe.servingsSelected || recipe.servings;
          const servings = recipe.servings;

          recipe.ingredients.forEach((ingredient) => {
            const { name, quantity, unit, rayon } = ingredient;
            const adjustedQuantity = parseFloat(adjustQuantity(quantity, servingsSelected, servings));

            if (!ingredientsList[rayon]) {
              ingredientsList[rayon] = [];
            }

            const existingIngredient = ingredientsList[rayon].find((item) => item.name === name);

            if (existingIngredient) {
              const totalQuantity = addQuantities(existingIngredient.quantity, adjustedQuantity, unit);
              existingIngredient.quantity = totalQuantity.quantity;
              existingIngredient.unit = totalQuantity.unit;
            } else {
              const formattedQuantity = formatQuantity(adjustedQuantity, unit);
              ingredientsList[rayon].push({
                name,
                quantity: formattedQuantity.quantity,
                unit: formattedQuantity.unit,
              });
            }
          });
        } else {
          Object.entries(mealContent).forEach(([subMealType, recipeData]) => {
            if (recipeData.ingredients) {
              const servingsSelected = recipeData.servingsSelected || recipeData.servings;
              const servings = recipeData.servings;

              recipeData.ingredients.forEach((ingredient) => {
                const { name, quantity, unit, rayon } = ingredient;
                const adjustedQuantity = parseFloat(adjustQuantity(quantity, servingsSelected, servings));

                if (!ingredientsList[rayon]) {
                  ingredientsList[rayon] = [];
                }

                const existingIngredient = ingredientsList[rayon].find((item) => item.name === name);

                if (existingIngredient) {
                  const totalQuantity = addQuantities(existingIngredient.quantity, adjustedQuantity, unit);
                  existingIngredient.quantity = totalQuantity.quantity;
                  existingIngredient.unit = totalQuantity.unit;
                } else {
                  const formattedQuantity = formatQuantity(adjustedQuantity, unit);
                  ingredientsList[rayon].push({
                    name,
                    quantity: formattedQuantity.quantity,
                    unit: formattedQuantity.unit,
                  });
                }
              });
            }
          });
        }
      });
    });

    const sortedIngredientsList = Object.keys(ingredientsList)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, rayon) => {
        acc[rayon] = ingredientsList[rayon].sort((a, b) => a.name.localeCompare(b.name));
        return acc;
      }, {});

    return sortedIngredientsList;
  };

  // Fonction pour formater les quantités en g/ml si elles sont inférieures à 1 kg ou 1 l
  const formatQuantity = (quantity, unit) => {
    if (unit === "kg" && quantity < 1) {
      return { quantity: (quantity * 1000).toFixed(0), unit: "g" };
    } else if (unit === "l" && quantity < 1) {
      return { quantity: (quantity * 1000).toFixed(0), unit: "ml" };
    } else {
      return { quantity: Number.isInteger(quantity) ? quantity : quantity.toFixed(2), unit };
    }
  };

  const addQuantities = (existingQuantity, newQuantity, unit) => {
    let existing = parseFloat(existingQuantity);
    let added = parseFloat(newQuantity);

    if (unit === "kg" || unit === "g") {
      if (existingQuantity.unit === "kg" && unit === "kg") {
        existing *= 1000;
      } else if (existingQuantity.unit === "g") {
        unit = "g";
      }
      const total = existing + added * (unit === "kg" ? 1000 : 1);
      const roundedTotal = total >= 1000
        ? Math.round(total / 1000 * 100) / 100 // Arrondir à deux décimales pour les kg
        : Math.round(total);                   // Arrondir à l'entier le plus proche pour les grammes
      return {
        quantity: roundedTotal,
        unit: total >= 1000 ? "kg" : "g"
      };
    } else if (unit === "l" || unit === "ml") {
      if (existingQuantity.unit === "l" && unit === "l") {
        existing *= 1000;
      } else if (existingQuantity.unit === "ml") {
        unit = "ml";
      }

      const total = existing + added * (unit === "l" ? 1000 : 1);
      const roundedTotal = total >= 1000
        ? Math.round(total / 1000 * 100) / 100 // Arrondir à deux décimales pour les litres
        : Math.round(total);                   // Arrondir à l'entier le plus proche pour les millilitres
      return {
        quantity: roundedTotal,
        unit: total >= 1000 ? "l" : "ml"
      };
    } else {
      // Autres unités, arrondies à deux décimales
      const total = existing + added;
      const roundedTotal = Math.round(total * 100) / 100;
      console.log('quantity :', roundedTotal, ' unit :', unit)
      return {
        quantity: roundedTotal,
        unit
      };
    }
  };

  // Convertir une fraction en nombre décimal
  const fractionToDecimal = (fraction) => {
    const [num, denom] = fraction.split('/').map(Number);
    return num / denom;
  };

  const adjustQuantity = (quantity, servingsSelected, servings) => {
    const adjustedQuantity = quantity * (servingsSelected / servings);
    return adjustedQuantity.toFixed(2);  // Garder en décimal avec deux décimales
  };

  const handleSaveMealPlan = async () => {
    if (!mealPlan) {
      Alert.alert('Erreur', 'Le mealPlan est vide ou non défini.');
      return;
    }
    console.log(mealPlan)

    const dates = Object.keys(mealPlan);
    const startDate = moment(dates[0]).format('DD/MM');
    const endDate = moment(dates[dates.length - 1]).format('DD/MM');
    const now = moment().format(`DD/MM/YYYY à HH:mm`);

    const title = startDate === endDate
      ? `${now} - menus du ${startDate}`
      : `${now} - menus du ${startDate} au ${endDate}`;

    const newEntry = {
      date: now,
      mealPlan,  // Enregistrez le mealPlan complet
      title
    };

    try {
      // Récupérer l'historique actuel
      // const currentHistory = await mealPlanHistorySaveAsync || [];

      // const currentHistory = await AsyncStorage.getItem('mealPlanHistory');
      // const parsedHistory = currentHistory ? JSON.parse(currentHistory) : [];
      
      // const updatedHistory = [...parsedHistory, newEntry];

      const currentHistory = await getStoredValue();
      const updatedHistory = [...currentHistory, newEntry]

      console.log('Historique actuel avant sauvegarde :', currentHistory);
      console.log('Nouveau mealPlan ajouté :', newEntry);
      
  
      // Trier et limiter à 10 éléments
      const sortedHistory = updatedHistory
        .sort((a, b) => moment(b.date, 'DD/MM/YYYY à HH:mm') - moment(a.date, 'DD/MM/YYYY à HH:mm'))
        .slice(0, 10);
  
      // Mettre à jour l'état local et sauvegarder
      setMealPlanHistory(sortedHistory);
      await setmealPlanHistorySaveAsync(sortedHistory);
  
      console.log('MealPlan sauvegardé avec succès :', sortedHistory);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du MealPlan :', error);
    }
  };

  const validateHistory = (history) => {
    return Array.isArray(history) && history.every(entry => 
      entry.date && entry.mealPlan && entry.title
    );
  };
  
  const loadMealPlanHistory = async () => {
    try {
      const savedHistory = mealPlanHistorySaveAsync;
      if (Array.isArray(savedHistory)) {
        setMealPlanHistory(savedHistory.slice(-10)); // Limiter à 10 éléments
        console.log('Historique chargé avec succès :', savedHistory.slice(-10));
      } else {
        console.warn('Historique non valide ou vide. Réinitialisation...');
        setMealPlanHistory([]);
        await setmealPlanHistorySaveAsync([]); // Réinitialiser
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique :', error);
    }
  };
 

  const addManualItem = () => {
    if (manualItem && newItemQuantity) {
      if (manualItem.trim() === '') {
        Alert.alert('Erreur', 'Veuillez entrer un élément valide.');
        return;
      }

      const newItem = {
        name: manualItem,
        quantity: parseFloat(Math.abs(newItemQuantity)), // Utiliser la valeur numérique choisie
        unit: selectedUnit,  // Utiliser l'unité sélectionnée
        rayon: selectedRayon, // Utiliser la catégorie sélectionnée
      };

      // Vérifiez si l'élément existe déjà
      const existingRayonList = shoppingList[selectedRayon] || [];
      const existingItem = existingRayonList.find(item => item.name.toLowerCase() === newItem.name.toLowerCase());

      if (existingItem) {
        // Si l'élément existe, incrémentez sa quantité
        incrementQuantity(selectedRayon, existingItem.name, newItem.quantity);
      } else {
        // Sinon, ajoutez un nouvel élément
        handleAddItem(newItem);
      }

      setManualItem('');
      setnewItemQuantity('');
      setSelectedUnit('unité');
      setSelectedRayon('Divers');
    } else {
      // Gestion d'erreurs si nécessaire
      alert('Veuillez remplir tous les champs');
    }
  };

  const incrementQuantity = (rayon, name, increment) => {
    setShoppingList(prevList => {
      const updatedList = { ...prevList };
      const ingredient = updatedList[rayon].find(item => item.name === name);

      if (ingredient) {
        // Si quantity est une chaîne (et potentiellement une fraction), on la convertit
        let currentQuantity;
        if (typeof ingredient.quantity === 'string' && ingredient.quantity.includes('/')) {
          // Si la quantité est une fraction, la convertir en décimal
          currentQuantity = parseFloat(fractionToDecimal(ingredient.quantity));
        } else {
          // Sinon, c'est une valeur numérique (ou une chaîne de type nombre)
          currentQuantity = parseFloat(ingredient.quantity);
        }

        // Ajouter l'incrément
        currentQuantity += increment;

        if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
          if (currentQuantity >= 1000) {
            // Convertir en kg si la quantité atteint ou dépasse 1000g
            ingredient.quantity = (currentQuantity / 1000).toFixed(2);
            ingredient.unit = ingredient.unit === 'g' ? 'kg' : 'l';
          } else {
            ingredient.quantity = Math.round(currentQuantity); // On garde en grammes
          }
        }
        // Si l'unité est "kg", convertir en g avant d'ajouter l'incrément
        else if (ingredient.unit === 'kg' || ingredient.unit === 'L') {
          console.log('increment', increment)
          currentQuantity *= 1000;  // Convertir en grammes avant l'ajout
          console.log('currentQuantity : ', currentQuantity)
          currentQuantity += increment; // Ajouter l'incrément en grammes
          console.log('currentQuantity : ', currentQuantity)

          if (currentQuantity >= 1000) {
            // Convertir en kg si la quantité atteint ou dépasse 1000g
            ingredient.quantity = (currentQuantity / 1000).toFixed(2);
            ingredient.unit = ingredient.unit === 'kg' ? 'kg' : 'L';
          } else {
            ingredient.quantity = Math.round(currentQuantity); // Retour en grammes
            ingredient.unit = ingredient.unit === 'kg' ? 'g' : 'ml';
          }
        }
        // Si l'unité est "unité", garder la quantité en décimal
        else { // if (ingredient.unit === 'unité')
          ingredient.quantity = currentQuantity.toFixed(1);  // Garder la décimale
        }
      }
      return updatedList;
    });
  };

  const decrementQuantity = (rayon, name, decrement) => {
    setShoppingList(prevList => {
      const updatedList = { ...prevList };
      const ingredient = updatedList[rayon].find(item => item.name === name);

      if (ingredient) {
        // S'assurer que quantity est un nombre (ou convertir une fraction en nombre)
        let currentQuantity = parseFloat(ingredient.quantity);
        if (isNaN(currentQuantity)) {
          currentQuantity = fractionToDecimal(ingredient.quantity);  // Conversion en nombre si c'est une fraction
        }

        // Décrémenter la quantité
        currentQuantity -= decrement;

        if (currentQuantity > 0) {
          // Si l'unité est "g", on garde en grammes et on ajuste si nécessaire
          if (ingredient.unit === 'g') {
            if (currentQuantity < 1000) {
              ingredient.quantity = Math.round(currentQuantity);  // Rester en grammes
            } else {
              ingredient.quantity = (currentQuantity / 1000).toFixed(1); // Convertir en kg
              ingredient.unit = 'kg';
            }
          }
          // Si l'unité est "kg", convertit d'abord en grammes et gère l'incrément
          else if (ingredient.unit === 'kg') {
            currentQuantity *= 1000; // Convertir en grammes avant la décrémentation
            currentQuantity -= decrement; // Décrémenter en grammes
            if (currentQuantity < 1000) {
              ingredient.quantity = Math.round(currentQuantity);  // Retour en grammes
              ingredient.unit = 'g';
            } else {
              ingredient.quantity = (currentQuantity / 1000).toFixed(1); // Retour en kg
            }
          }
          // Si l'unité est "unité", on garde la quantité en décimal
          else {
            ingredient.quantity = currentQuantity.toFixed(1);
          }
        } else {
          // Si la quantité devient 0 ou négative, supprimer l'ingrédient
          updatedList[rayon] = updatedList[rayon].filter(item => item.name !== name);
        }
      }
      return updatedList;
    });
  };

  const handleCopy = () => {
    const listText = Object.keys(shoppingList).map(rayon =>
      `${rayon}:\n` + shoppingList[rayon].map(item => `${item.name}: ${item.quantity} ${item.unit}`).join('\n')
    ).join('\n\n');

    Clipboard.setStringAsync(listText)
      .then(() => {
        Alert.alert('Bonne nouvelle !', '\nVotre liste de courses a été copiée dans le presse-papiers !');
      })
      .catch(err => {
        Alert.alert('Erreur', '\nErreur lors de la copie dans le presse-papiers.');
      });
  };

  const handleAddItem = (newItem) => {
    const { name, quantity, unit, category } = newItem;

    const rayon = selectedRayon;

    // Si le rayon n'existe pas, on le crée
    if (!shoppingList[selectedRayon]) {
      shoppingList[selectedRayon] = [];
    }

    const existingItemIndex = shoppingList[selectedRayon].findIndex(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingItemIndex !== -1) {
      // L'élément existe déjà, on incrémente la quantité
      const updatedQuantity = shoppingList[selectedRayon][existingItemIndex].quantity + quantity;
      const updatedItem = {
        ...shoppingList[selectedRayon][existingItemIndex],
        quantity: updatedQuantity,
        unit: unit || existingItem.unit,
        category: category || existingItem.category
      };
      const updatedShoppingList = {
        ...shoppingList,
        [selectedRayon]: shoppingList[selectedRayon].map((item, index) => index === existingItemIndex ? updatedItem : item)
      };
      setShoppingList(updatedShoppingList);

    } else {
      // L'élément n'existe pas, on l'ajoute normalement
      const newItemWithDetails = {
        name,
        quantity,
        unit: unit || 'g', // Par défaut 'g' si l'utilisateur n'a pas sélectionné d'unité
        category: category || 'Divers' // Pareil pour la catégorie
      };
      const updatedShoppingList = { ...shoppingList };
      updatedShoppingList[rayon].push(newItemWithDetails);
      setShoppingList(updatedShoppingList);
    }
  };

  const saveCheckedItems = async (updatedCheckedItems) => {
    try {
      const activeMealPlan = mealPlanHistory.find(
        (entry) => JSON.stringify(entry.mealPlan) === JSON.stringify(mealPlan)
      );

      console.log('updatedCheckedItems :', updatedCheckedItems)
      if (activeMealPlan) {
        await AsyncStorage.setItem(`checkedItems_${activeMealPlan.date}`, JSON.stringify(updatedCheckedItems));
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'état des éléments cochés", error);
    }
  };

  const toggleCheckbox = (ingredientName) => {
    const updatedCheckedItems = {
      ...checkedItems,
      [ingredientName]: !checkedItems[ingredientName], // Inverser l'état de la case
    };
    setCheckedItems(updatedCheckedItems);

    saveCheckedItems(updatedCheckedItems); // Sauvegarde avec la clé unique du mealPlan
  };


  return (

    <ImageBackgroundWrapper imageOpacity={0.46}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={toggleHideMenu} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>?</Text>
          </TouchableOpacity>

          <Modal
            transparent={true}
            visible={showHideMenu}
            animationType="fade"
            onRequestClose={() => setShowHideMenu(false)}
          >
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowHideMenu(false)}>
              {/* <View style={styles.menu}> */}
              <TouchableOpacity onPress={toggleHideCheckedItems} style={styles.menuItem}>
                <Text style={styles.menuItemText}>
                  {hideCheckedItems ? 'Afficher les éléments cochés' : 'Masquer les éléments cochés'}
                </Text>
              </TouchableOpacity>
              {/* </View> */}
            </TouchableOpacity>
          </Modal>


          <View style={styles.headerContainer}>
            {/* <Text style={styles.header}>Liste de courses</Text> */}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {Object.keys(shoppingList).length === 0 ? (
            <Text>Aucune liste de courses générée.</Text>
          ) : (
            Object.keys(shoppingList).map((rayon) => {
              // Vérifier si tous les éléments sont masqués (tous les éléments sont cochés)
              const allItemsHidden = shoppingList[rayon].every((ingredient) =>
                hideCheckedItems && checkedItems[ingredient.name]
              );

              return (
                <View key={rayon} style={styles.rayonSection}>
                  {/* Affichage conditionnel du nom du rayon */}
                  {!allItemsHidden && <Text style={styles.rayonHeader}>{rayon}</Text>}

                  {/* Parcours des ingrédients de chaque rayon */}
                  {(shoppingList[rayon] || []).map((ingredient) => (
                    (hideCheckedItems && checkedItems[ingredient.name]) ? null : (
                      <View key={ingredient.name} style={styles.ingredientRow}>
                        <Checkbox
                          status={checkedItems[ingredient.name] ? 'checked' : 'unchecked'}
                          onPress={() => {
                            toggleCheckbox(ingredient.name)
                            setCheckedItems({
                              ...checkedItems,
                              [ingredient.name]: !checkedItems[ingredient.name]
                            })
                          }}
                        />
                        <Text style={styles.ingredientText}>
                          {ingredient.name} - {ingredient.quantity} {ingredient.unit}
                        </Text>
                        <View style={styles.buttonGroup}>
                          <Button onPress={() => decrementQuantity(rayon, ingredient.name, ingredient.unit === 'g' || ingredient.unit === 'ml' ? (ingredient.quantity < 1000 ? 10 : 100) : 1)}>
                            -
                          </Button>
                          <Button onPress={() => incrementQuantity(rayon, ingredient.name, ingredient.unit === 'g' || ingredient.unit === 'ml' ? (ingredient.quantity < 1000 ? 10 : 100) : 1)}>
                            +
                          </Button>
                        </View>
                      </View>
                    )
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.somespace}></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: -20, marginVertical: 5 }}>
          <TextInput
            placeholder="Ajouter un nouvel élément"
            value={manualItem}
            onChangeText={setManualItem}
            style={styles.input}
          />
          <TextInput
            placeholder="Quantité"
            value={newItemQuantity}
            onChangeText={setnewItemQuantity}
            keyboardType="numeric" // Affiche le clavier numérique
            style={styles.numericInput} // Nouveau style pour le champ de quantité
          />
          <TouchableOpacity onPress={() => setUnitModalVisible(true)} style={styles.unitButton}>
            <Text style={styles.buttonModalText}>{selectedUnit}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRayonModalVisible(true)} style={styles.rayonButton}>
            <Text style={styles.buttonModalText}>{selectedRayon}</Text>
          </TouchableOpacity>
        </View>


        <TouchableOpacity style={styles.AddButtonNotFlex} onPress={addManualItem}>
          <Text style={styles.mainButtonText}>Ajouter à la liste</Text>
        </TouchableOpacity>

        <View style={styles.somespace}></View>

        {/* Modal pour sélectionner l'unité */}
        <Modal visible={unitModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir une unité</Text>
              {availableUnits.map((unit) => (
                <TouchableOpacity key={unit} onPress={() => {
                  setSelectedUnit(unit);
                  setUnitModalVisible(false);
                }}>
                  <Text style={styles.modalOption}>{unit}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setUnitModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal pour sélectionner le rayon */}
        <Modal visible={rayonModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir une catégorie</Text>
              {availableRayons.map((rayon) => (
                <TouchableOpacity key={rayon} onPress={() => {
                  setSelectedRayon(rayon);
                  console.log('Fermeture du modal rayon');
                  setRayonModalVisible(false);
                }}>
                  <Text style={styles.modalOption}>{rayon}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setRayonModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


        {/* Boutons "Sauvegarder" et "Copier" sur la même ligne */}
        <View style={{ height: 5 }}></View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => {
              navigation.navigate('HomeScreen'); // Navigue vers HomeScreen
            }}
          >
            <Text style={styles.mainButtonText}>Retour au menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={handleCopy}>
            <Text style={styles.mainButtonText}>Copier la liste</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flexGrow: 0,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginBottom: 10,
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
    padding: 10,
    borderRadius: 5,
    // width: '60%',
    flex: 4,
    marginHorizontal: 2.5,
  },
  numericInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 1.5, // Ajustez la largeur si nécessaire
    marginHorizontal: 2.5,
  },
  unitButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    flex: 1, // Ajustez la largeur du bouton pour qu'il s'adapte
    marginHorizontal: 2.5, // Espacement entre les boutons
  },
  rayonButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    flex: 1, // Ajustez la largeur du bouton pour qu'il s'adapte
    marginHorizontal: 2.5, // Espacement entre les boutons
  },
  buttonModalText: {
    color: '#000',
  },
  addButton: {
    marginTop: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // width: '100%',
    // justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    marginVertical: 2.5,
  },
  AddButtonNotFlex: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    width: '100%',
  },
  mainButton: {
    backgroundColor: '#fff',
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    flexBasis: '48%',
    alignItems: 'center',
    width: '100%',
  },
  mainButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
  },
  saveButton: {
    marginTop: 20,
  },
  somespace: {
    // padding: 10,
    height: 10,
    // backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent pour le modal
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 40,
    borderRadius: 10,
    elevation: 5, // Pour l'ombre sur Android
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    fontSize: 16,
    padding: 10,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  closeButton: {
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff', // Couleur du texte
    fontSize: 16, // Taille du texte
    textAlign: 'center', // Centre le texte
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 10,
    paddingBottom: 15,
    // backgroundColor: 'red',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    // top: 10,
    right: 10,
    width: 40, // Ajuste la taille selon tes besoins
    height: 40,
    borderRadius: 25, // Pour un bouton rond
    backgroundColor: '#ccc', // Couleur du bouton
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // Ombre pour donner un effet de profondeur
    zIndex: 2,
  },
  menuButtonText: {
    color: '#FFFFFF', // Couleur du texte
    fontSize: 24, // Ajuste la taille selon tes besoins
    textAlign: 'center',
  },
  menuItem: {
    position: 'absolute',
    // textAlign: 'right',
    top: 72.5,
    right: 80,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ccc'
  },
  menuItemText: {
    // position: 'relative',
    // top: '100',
    // right: '60',
    color: '#333',
  },
});
