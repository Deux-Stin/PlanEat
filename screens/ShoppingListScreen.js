import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
// import { useAsyncStorage } from '../hooks/useAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

export default function ShoppingListScreen({ navigation, route }) {
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingHistory, setShoppingHistory] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [manualItem, setManualItem] = useState('');
  const [newItemQuantity, setnewItemQuantity] = useState(''); // État pour la valeur numérique du modal d'unité
  const { mealPlan, historyItem  } = route.params; // Recevoir le mealPlan à partir de la navigation

  const availableUnits = ['unité', 'g', 'kg', 'ml', 'L', 'petite cuillère', 'grande cuillère'];
  const availableRayons = ['Divers','Produits frais', 'Boucherie', 'Poissonnerie', 'Boulangerie', 'Épicerie', 'Fruits et légumes', 'Surgelés', 'Produits laitiers', 'Boissons', 'Hygiène', 'Entretien'].sort((a, b) => a.localeCompare(b)); // Trie le tableau par ordre alphabétique
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [rayonModalVisible, setRayonModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('unité');
  const [selectedRayon, setSelectedRayon] = useState('Divers');

  // Charger l'historique des listes de courses lors du premier rendu
  useEffect(() => {
    loadShoppingHistory();
  }, []);

  useEffect(() => {
    if (historyItem && historyItem.list) {
      // Assigner la liste passée à l'état
      setShoppingList(historyItem.list);
    }
  }, [historyItem]);

  useEffect(() => {
    if (mealPlan) {
      // Réinitialiser shoppingList à chaque mise à jour de mealPlan
      setShoppingList([]);

      // Réinitialiser la liste de courses avant de la générer
      const ingredients = generateShoppingList(mealPlan);
      setShoppingList(ingredients);
    }
  }, [mealPlan]);

  const generateShoppingList = (mealPlan) => {
    const ingredientsList = {};
  
    // Parcourir le mealPlan pour collecter les ingrédients
    Object.entries(mealPlan).forEach(([date, meals]) => {
      Object.entries(meals).forEach(([mealType, recipe]) => {
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.forEach((ingredient) => {
            const { name, quantity, unit, rayon } = ingredient;
  
            // Créer une nouvelle section pour le rayon si elle n'existe pas
            if (!ingredientsList[rayon]) {
              ingredientsList[rayon] = [];
            }
  
            // Vérifier si l'ingrédient existe déjà dans le même rayon pour combiner les quantités
            const existingIngredient = ingredientsList[rayon].find((item) => item.name === name);
            if (existingIngredient) {
              existingIngredient.quantity += quantity;
            } else {
              ingredientsList[rayon].push({ name, quantity, unit });
            }
          });
        }
      });
    });
  
    return ingredientsList;
  };
  

  const handleSaveShoppingList = async () => {
    // Obtenir la plage de dates du mealPlan
    const dates = Object.keys(mealPlan);
    const startDate = moment(dates[0]).format('DD/MM');
    const endDate = moment(dates[dates.length - 1]).format('DD/MM');
    const now = moment().format(`DD/MM/YYYY à HH:mm`);
    let title;

    if (startDate === endDate) {
        title = `${now} - menus du ${startDate}`;
    } else {
        title = `${now} - menus du ${startDate} au ${endDate}`;
    }
    
    const newEntry = {
        date: `${now}`,
        list: shoppingList,
        title: title
    };
    console.log('newEntry : ', newEntry);
    const updatedHistory = [...shoppingHistory, newEntry];
    // Trier par date décroissante
    const sortedHistory = updatedHistory.sort((a, b) => moment(b.date, 'DD/MM/YYYY à HH:mm') - moment(a.date, 'DD/MM/YYYY à HH:mm')).slice(0, 10);

    setShoppingHistory(sortedHistory);

    try {
        await AsyncStorage.setItem('shoppingHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'historique', error);
      }
    // await saveShoppingHistory(sortedHistory);
    // console.log('updatedHistory', updatedHistory);


    alert('Liste de courses sauvegardée avec succès !');

    // Recharge l'historique ici pour mettre à jour la page d'accueil
    loadShoppingHistory(); 
    // Naviguer vers une autre page ou réinitialiser le mealPlan
    navigation.goBack(); // Utilisez goBack() ou naviguez vers un autre écran
  };


  const loadShoppingHistory = async () => {
    try {
      const value = await AsyncStorage.getItem('shoppingHistory');
      if (value !== null) {
        const history = JSON.parse(value);
        setShoppingHistory(history.slice(-10)); // Limiter à 10 entrées
        console.log('Historique récupéré : ', history.slice(-10))
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique', error);
    }
  };
  
  const saveShoppingHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem('shoppingHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'historique', error);
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
        quantity: parseFloat(newItemQuantity), // Utiliser la valeur numérique choisie
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

  const handleAddItem = (newItem) => {
    const { name, quantity, unit, category } = newItem;

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



  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>{item.name} : {item.quantity}</Text>
    </View>
  );

  return (
    // <View style={styles.container}>
    //   <Text variant="headlineMedium" style={styles.title}>Liste de Courses</Text>
    //   <FlatList
    //     data={shoppingList}
    //     renderItem={renderItem}
    //     keyExtractor={(item, index) => index.toString()}
    //     style={styles.list}
    //   />
    //   <Button mode="contained" onPress={handleSaveShoppingList} style={styles.saveButton}>
    //     Sauvegarder la liste de courses
    //   </Button>
    // </View>

    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.header}>Liste de courses</Text>

        {/* Rendu des éléments de la liste de courses */}
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
      </ScrollView>

      <View style={styles.somespace}></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginVertical: 5 }}>
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

        <TouchableOpacity onPress={() => setRayonModalVisible(true)} style={styles.dropdownButton}>
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
                setRayonModalVisible(false);
              }}>
                <Text style={styles.modalOption}>{rayon}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setUnitModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Boutons "Sauvegarder" et "Copier" sur la même ligne */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.mainButton} onPress={handleSaveShoppingList}>
          <Text style={styles.mainButtonText}>Sauvegarder la liste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mainButton} onPress={handleCopy}>
          <Text style={styles.mainButtonText}>Copier</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.mainButtonNotFlex} onPress={() => navigation.navigate('HomeScreen')}>
        <Text style={styles.mainButtonText}>Retour au menu principal</Text>
      </TouchableOpacity>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    backgroundColor: '#9acbff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    flex: 1, // Ajustez la largeur du bouton pour qu'il s'adapte
    marginHorizontal: 2.5, // Espacement entre les boutons
  },
  dropdownButton: {
      backgroundColor: '#9acbff',
      padding: 15,
      borderRadius: 10,
      marginVertical: 2.5,
      alignItems: 'center',
      flex: 1, // Ajustez la largeur du bouton pour qu'il s'adapte
      marginHorizontal: 2.5, // Espacement entre les boutons
  },
  buttonModalText: {
    color: '#fff',
  },
  addButton: {
    marginTop: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    // width: '100%',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    marginVertical: 2.5,
  },  
  mainButtonNotFlex: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    width: '100%',
  },
  AddButtonNotFlex: {
    backgroundColor: '#9acbff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    alignItems: 'center',
    width: '100%',
  },
  mainButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 2.5,
    flexBasis: '48%',
    alignItems: 'center',
    width: '100%',
  },
  mainButtonText: {
    color: '#fff',
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
    height: 20,
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
    padding: 20,
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
});
