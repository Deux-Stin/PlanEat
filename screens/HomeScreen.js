import React, { useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';

export default function HomeScreen({ navigation }) {
  const [shoppingHistory, setShoppingHistory] = useAsyncStorage('shoppingHistory', []);
  const [showHideMenu, setShowHideMenu] = useState(false);
  const swipeableRefs = useRef([]); 

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

  const showInfoAlert = () => {
    Alert.alert("Information", "\nCette application vous permet d'enregistrer vos recettes, d'en importer de nouvelles ou bien de les partager avec vos proches.\n\nElle permet également de planifier vos repas sur une plage calendaire et de générer votre liste de courses en fonction de vos menus et du nombre de portions.\n\nBonne utilisation ! \n\n\n\nPour toute suggestion/bug n'hésitez pas à me contacter : dustyn.naya@gmail.com");
  };

  const renderItem = ({ item, index }) => (
    <Swipeable 
      renderRightActions={() => renderRightActions(item, index)}
      onSwipeableWillOpen={() => {
        swipeableRefs.current.forEach((ref, i) => {
          if (ref && i !== index) {
            ref.close(); 
          }
        });
      }}
      ref={ref => (swipeableRefs.current[index] = ref)} 
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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

      {/* Bouton d'information */}
      <TouchableOpacity onPress={showInfoAlert} style={styles.infoButton}>
        <Text style={styles.infoButtonText}>i</Text>
      </TouchableOpacity>

      <FlatList
        data={shoppingHistory}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.historyList}
        ListHeaderComponent={() => (
          <View style={styles.container}>
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
            </View>
          </View>
        )}
      />
      <View style={styles.somespace} />
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center', 
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
    flexDirection: 'column',   
    alignItems: 'center',      
    marginTop: 10,
    width: '100%',             
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
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: '90%',
    width: 80,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  somespace: {
    height: 5,
    // backgroundColor: '#fff',
  },
  infoButton: {
    position: 'absolute',
    zIndex: 10, // Ajout d'un zIndex pour le rendre au-dessus
    top: 60,
    right: 30, // Ajuste la position pour qu'il ne soit pas superposé avec le bouton menu
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: '#ccc', // Couleur du bouton d'information
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
});
