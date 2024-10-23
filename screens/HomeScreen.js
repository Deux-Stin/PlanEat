import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';

export default function HomeScreen({ navigation }) {
  const [shoppingHistory, setShoppingHistory] = useAsyncStorage('shoppingHistory', []);
  const swipeableRefs = useRef([]); // Référence pour les éléments swipeables

  // Recharge l'historique à chaque fois que l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      loadShoppingHistory();
    }, [])
  );

  const loadShoppingHistory = async () => {
    try {
      const value = await AsyncStorage.getItem('shoppingHistory');
      if (value !== null) {
        setShoppingHistory(JSON.parse(value));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique', error);
    }
  };

  const deleteHistoryItem = async (itemToDelete) => {
    const updatedHistory = shoppingHistory.filter(item => item !== itemToDelete);
    setShoppingHistory(updatedHistory);
    await AsyncStorage.setItem('shoppingHistory', JSON.stringify(updatedHistory));
  };

  const renderRightActions = (item, index) => (
    <TouchableOpacity 
      style={styles.deleteButton}
      onPress={() => {
        Alert.alert(
          "Confirmation",
          "Êtes-vous sûr de vouloir supprimer cette entrée ?",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Supprimer", onPress: () => deleteHistoryItem(item) }
          ]
        );
      }}
    >
      <Text style={styles.deleteButtonText}>Supprimer</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, index }) => (
    <Swipeable 
      renderRightActions={() => renderRightActions(item, index)}
      onSwipeableWillOpen={() => {
        // Fermer tous les autres swipes ouverts
        swipeableRefs.current.forEach((ref, i) => {
          if (ref && i !== index) {
            ref.close(); // Fermer le swipe d'un autre élément
          }
        });
      }}
      ref={ref => (swipeableRefs.current[index] = ref)} // Ajouter la référence
    >
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('ShoppingListScreen', { historyItem: item })}
      >
        <Text style={styles.historyButtonText}>{item.title}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <ScrollView 
      contentContainerStyle={styles.container} // Utiliser contentContainerStyle pour le ScrollView
    >
      <Text style={styles.title}>Bienvenue dans PlanEat !</Text>
      
      {/* Section des boutons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('RecipeLibrary')}>
            <Text style={styles.mainButtonText}>Bibliothèque de recettes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('MealPlanScreen', {fromHome: true})}>
            <Text style={styles.mainButtonText}>Planifier vos repas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('ShoppingListScreen', { mealPlan: {} })}>
            <Text style={styles.mainButtonText}>Voir ma liste de courses</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section historique */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des listes de courses</Text>
        <FlatList
          data={shoppingHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.historyList}
          nestedScrollEnabled // Autorise le défilement imbriqué
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Permet au conteneur de croître selon le contenu
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center', // Centre les éléments horizontalement
  },
  title: {
    fontSize: 40,
    marginTop: 20,
    marginBottom: 60,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',   // Arrange les boutons verticalement
    alignItems: 'center',      // Centre les boutons horizontalement
    marginTop: 10,
    width: '100%',             // Assure que les boutons prennent toute la largeur disponible
  },
  mainButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
    width: '100%',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  historyList: {
    width: '100%',
  },
  historyButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center', // Centre le texte verticalement et horizontalement
  },
  historyButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: '80%',
    width: 80,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
