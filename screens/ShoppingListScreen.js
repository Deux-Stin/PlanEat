import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

export default function ShoppingListScreen({ navigation, route }) {
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingHistory, setShoppingHistory] = useState([]);
  const { mealPlan, historyItem  } = route.params; // Recevoir le mealPlan à partir de la navigation

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
    const ingredientMap = {};
    console.log('mealPlan', mealPlan)

    // Parcourir le mealPlan pour collecter les ingrédients
    Object.keys(mealPlan).forEach(date => {
      const meals = mealPlan[date];
      Object.keys(meals).forEach(mealType => {
        const recipe = meals[mealType];
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ingredient => {
            if (ingredientMap[ingredient.name]) {
              ingredientMap[ingredient.name] += ingredient.quantity; // Additionner les quantités
            } else {
              ingredientMap[ingredient.name] = ingredient.quantity; // Initialiser la quantité
            }
          });
        }
      });
    });

    // Convertir l'objet ingredientMap en tableau
    return Object.keys(ingredientMap).map(name => ({
      name,
      quantity: ingredientMap[name],
    }));
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

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>{item.name} : {item.quantity}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Liste de Courses</Text>
      <FlatList
        data={shoppingList}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
      />
      <Button mode="contained" onPress={handleSaveShoppingList} style={styles.saveButton}>
        Sauvegarder la liste de courses
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flexGrow: 0,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  saveButton: {
    marginTop: 20,
  },
});
