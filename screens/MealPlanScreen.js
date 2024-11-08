import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native'; 
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Checkbox, BottomNavigation } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import 'moment/locale/fr';
import moment from 'moment';
moment.locale('fr');

export default function MealPlanScreen({ navigation, route}) {
  const [selectedDates, setSelectedDates] = useState({});
  const [mealsSelection, setMealsSelection] = useState({});
  const [mealPlan, setMealPlan] = useState({});
  const [recipes] = useAsyncStorage('recipes', []);
  const [portions, setPortions] = useState(1); // Nombre de portions

  // Obtenir la date actuelle
  const today = moment().format('YYYY-MM-DD');

  useFocusEffect(
    React.useCallback(() => {
      console.log('route.params?.fromHome', route.params?.fromHome)
      if (route.params?.fromHome) {
        console.log('Passage par useFocusEffect pour faire un reset propre.')
        resetSelections(); // Appelle la fonction resetSelections seulement si on vient de HomeScreen
        route.params.fromHome = false;
      }
    }, [route.params]) // Ajoute route.params comme dépendance
  );

  const mealTypeToCategory = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
  };

  const markedDates = {};
  // Marquer les dates passées
  for (let i = 0; i < 365; i++) { // Limiter à 365 jours dans le passé
    const pastDate = moment(today).subtract(i + 1, 'days').format('YYYY-MM-DD');
    markedDates[pastDate] = { disabled: true, selectedColor: 'gray' };
  }

  const handleDayPress = (day) => {

    // Vérifier si la date sélectionnée est passée
    if (moment(day.dateString).isBefore(today)) {
      Alert.alert("Hum, try again !","Vous essayez vraiment de sélectionner une date du passé ? \n \nEssayez plutôt le turfu, ça a l'air sympa ! :)")
      return; // Ne rien faire si la date est dans le passé
    }

    const newSelectedDates = { ...selectedDates };
    if (newSelectedDates[day.dateString]) {
      // Date déjà sélectionnée, on la désélectionne
      delete newSelectedDates[day.dateString];

      // Supprimer les sélections de repas pour cette date
      const newMealsSelection = { ...mealsSelection };
      delete newMealsSelection[day.dateString];
      setMealsSelection(newMealsSelection);

      // Supprimer les repas du mealPlan pour cette date
      setMealPlan((prevMealPlan) => {
        const updatedMealPlan = { ...prevMealPlan };
        delete updatedMealPlan[day.dateString];
        return updatedMealPlan;
      });
    } else {
      newSelectedDates[day.dateString] = { selected: true, selectedColor: 'blue' };
    }
    setSelectedDates(newSelectedDates);
  };

  const handleMealCheckboxChange = async (date, meal) => {
    const newMealsSelection = { ...mealsSelection };
    newMealsSelection[date] = {
      ...newMealsSelection[date],
      [meal]: !newMealsSelection[date]?.[meal],
    };
    setMealsSelection(newMealsSelection);
  
    const updatedMealPlan = { ...mealPlan };
  
    if (!newMealsSelection[date][meal]) {
      if (updatedMealPlan[date]) {
        delete updatedMealPlan[date][meal];
        if (!updatedMealPlan[date].breakfast && !updatedMealPlan[date].lunch && !updatedMealPlan[date].dinner) {
          delete updatedMealPlan[date];
        }
      }
    }
  
    setMealPlan(updatedMealPlan);
    // Mettez à jour AsyncStorage avec le nouveau mealPlan
    // await setMealPlan(updatedMealPlan);
    // AsyncStorage.setItem('mealPlan', JSON.stringify(updatedMealPlan)); // Mettez à jour AsyncStorage
  };
  
  
  const handleRecipeSelection = (date, mealType, recipeName, category) => {
    console.log('Sélectionner recette:', recipeName, 'pour', category);
    const selectedRecipe = recipes.find((recipe) => recipe.name === recipeName);

    setMealPlan((prevMealPlan) => {
      const updatedMealPlan = { ...prevMealPlan };

      console.log('prevMealPlan',prevMealPlan);
  
      if (!updatedMealPlan[date]) updatedMealPlan[date] = {};
  
      if (mealType === 'breakfast') {
        updatedMealPlan[date][mealType] = selectedRecipe;
      } else {
        // console.log('selectedRecipe : ', selectedRecipe)
        // console.log('updatedMealPlan[date][mealType]', updatedMealPlan[date][mealType])
        updatedMealPlan[date][mealType] = {
          ...updatedMealPlan[date][mealType],
          [category]: selectedRecipe, // Ajoute la recette à la catégorie spécifique
        };
      }
  
      console.log('updatedMealPlan',updatedMealPlan);
      return updatedMealPlan;
    });
  };
  

  const handleSaveMealPlan = () => {
    const hasMealsSelected = Object.keys(mealPlan).some(date => 
      mealPlan[date].breakfast || mealPlan[date].lunch || mealPlan[date].dinner
    );
  
    if (!hasMealsSelected) {
      alert('Veuillez sélectionner au moins un repas avant de générer la liste de courses.');
      return;
    }
  
    // Naviguer vers la liste de courses en passant le mealPlan
    console.log('mealPlan envoyé à la ShoppingListScreen :', mealPlan)
    navigation.navigate('ShoppingListScreen', { mealPlan });
  };    

  const filterRecipesByMealType = (mealType) => {
    const categoryMap = {
      breakfast: 'Petit-déjeuner',
      lunch: 'Déjeuner',
      dinner: 'Dîner',
    };
  
    const category = mealTypeToCategory[mealType];
    if (!category) return []; // Si category n'existe pas, retourne un tableau vide
  
    return recipes.filter((recipe) => {
      if (mealType === 'breakfast') {
        return Array.isArray(recipe.category)
          ? recipe.category.includes(category) // Si recipe.category est un tableau, on cherche la catégorie dedans
          : recipe.category === category; // Sinon, on compare directement
      }
  
      if (mealType === 'lunch' || mealType === 'dinner') {
        const formattedCategory = recipe.category.trim().toLowerCase();
        console.log('recipe.category:', recipe.category, formattedCategory === category.toLowerCase() || ['entrée', 'plat', 'dessert'].includes(formattedCategory));
  
        // Ici, on vérifie si recipe.category est dans les sous-catégories "entrée", "plat", ou "dessert"
        return ['entrée', 'plat', 'dessert'].includes(formattedCategory);
      }
  
      return false; // Si aucune des conditions n'est remplie, retourne false
    });
  };

  const filterRecipesByCategory = (category) => {
    return recipes.filter((recipe) => {
      const normalizedCategory = category.toLowerCase(); // Normaliser la casse de la catégorie entrée
      if (Array.isArray(recipe.category)) {
        return recipe.category.some((cat) => cat.toLowerCase() === normalizedCategory); // Vérifie chaque catégorie si c'est un tableau
      }
      return recipe.category.toLowerCase() === normalizedCategory; // Comparaison directe pour une seule catégorie
    });
  };
  


  // Reset selections
  const resetSelections = async () => {
    setSelectedDates({
      // [today]: { selected: true, selectedColor: 'blue' } // Garde le jour actuel marqué
    });
    setMealsSelection({});
    setMealPlan({}); // Réinitialise le mealPlan à un objet vide
    setPortions(1);
  };   
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.section}>
          <View style={styles.somespace}></View>
          {/* <Text style={styles.sectionTitle}>Planifier vos repas</Text> */}

          <Calendar
            current={today} // Affiche la date actuelle
            //{new Date().toISOString().split('T')[0]}
            onDayPress={handleDayPress}
            // markedDates={selectedDates}
            markedDates={{ ...selectedDates, ...markedDates }}
            hideExtraDays={true}
            enableSwipeMonths={true}
            renderArrow={(direction) => (
              <Text>{direction === 'left' ? '<' : '>'}</Text>
            )}
            monthFormat={'MMMM yyyy'}
            firstDay={1}
            dayNames={['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']}
            dayNamesShort={['D', 'L', 'M', 'M', 'J', 'V', 'S']}
            monthNames={[
              'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nombre de portions</Text>
            <View style={styles.portionSelectorContainer}>
              <Picker
                selectedValue={portions}
                onValueChange={(itemValue) => setPortions(itemValue)}
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <Picker.Item key={num} label={`${num} portion(s)`} value={num} />
                ))}
              </Picker>
            </View>
          </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélection des repas</Text>

          {Object.keys(selectedDates).length > 0 ? (
            Object.keys(selectedDates).map((date) => (
              <View key={date} style={styles.mealSection}>
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateText}>{moment(date).format('DD/MM/YYYY')}</Text>
                </View>

                <View style={styles.checkboxContainer}>
                  <View style={styles.checkboxWrapper}>
                    <Text>Petit-déjeuner</Text>
                    <Checkbox
                      status={mealsSelection[date]?.breakfast ? 'checked' : 'unchecked'}
                      onPress={() => {
                        handleMealCheckboxChange(date, 'breakfast');
                      }}
                    />
                  </View>
                  <View style={styles.checkboxWrapper}>
                    <Text>Déjeuner</Text>
                    <Checkbox
                      status={mealsSelection[date]?.lunch ? 'checked' : 'unchecked'}
                      onPress={() => {
                        handleMealCheckboxChange(date, 'lunch');
                      }}
                    />
                  </View>
                  <View style={styles.checkboxWrapper}>
                    <Text>Dîner</Text>
                    <Checkbox
                      status={mealsSelection[date]?.dinner ? 'checked' : 'unchecked'}
                      onPress={() => {
                        handleMealCheckboxChange(date, 'dinner');
                      }}
                    />
                  </View>
                </View>

                {/* Sélection des recettes pour les repas cochés */}
                {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                  mealsSelection[date]?.[mealType] && (
                    <View style={styles.mealAttribution} key={mealType}>
                      <Text style={styles.textAttribution}>
                        Sélectionner une recette pour le 
                        <Text style={styles.boldText}> {mealTypeToCategory[mealType].toLowerCase()}</Text>
                      </Text>

                      {mealType === 'breakfast' ? (
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={mealPlan[date]?.[mealType]?.name || ''}
                            onValueChange={(itemValue) => handleRecipeSelection(date, mealType, itemValue, 'breakfast')}
                          >
                            <Picker.Item label="Sélectionner une recette" value="" />
                            {filterRecipesByMealType(mealType).map((recipe, index) => (
                              <Picker.Item key={index} label={recipe.name} value={recipe.name} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        ['entrée', 'plat', 'dessert'].map((category) => (
                          <View key={category} style={styles.pickerContainer}>
                            <Text>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                            <Picker
                              selectedValue={mealPlan[date]?.[mealType]?.[category]?.name || ''}
                              onValueChange={(itemValue) => handleRecipeSelection(date, mealType, itemValue, category)} 
                            >
                              <Picker.Item label={`Sélectionner une ${category}`} value="" />
                              {filterRecipesByCategory(category).map((recipe, index) => (
                                <Picker.Item key={index} label={recipe.name} value={recipe.name} />
                              ))}
                            </Picker>
                          </View>
                        ))
                      )}
                    </View>
                  )
                ))}
              </View>
            ))
          ) : (
            <Text>Aucune date sélectionnée pour le moment.</Text>
          )}
        </View>
      </ScrollView>

      {/* Boutons fixes en bas */}
      <View style={styles.section}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleSaveMealPlan}>
            <Text style={styles.mainButtonText}>Enregistrer et générer la liste de courses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={resetSelections}>
            <Text style={styles.mainButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 10, // Pour laisser de l'espace pour le bouton fixe
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  // title: {
  //   fontSize: 40,
  //   marginTop: 20,
  //   marginBottom: 60,
  //   textAlign: 'center',
  // },
  section: {
    width: '100%',
    marginBottom: 10,
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
  portionSelectorContainer: {
    backgroundColor: '#e6e6e6',
    borderRadius: 5, // Pour arrondir les coins
    // elevation: 5, // Pour ajouter de l'ombre si nécessaire
    // padding: 5, // Pour un peu d'espace intérieur
  },
  
  mealSelection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  mealTitle: {
    fontWeight: 'bold',
  },
  mealSection: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    backgroundColor: '#e6e6e6',
    elevation: 5,
  },
  mealAttribution: {
    // backgroundColor: 'red',
  },
  textAttribution:{
    fontSize: 16,
    marginTop: 10,
    // marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 5,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  test:{
    // height:100,
  },
  pickerContainer:{
    backgroundColor: '#fff',
    padding: 0,
    borderRadius: 5, // Pour arrondir les coins
    elevation: 5, // Pour ajouter de l'ombre si nécessaire
    // padding: 5, // Pour un peu d'espace inté
  },

  picker: {
    height: 50, // Hauteur du Picker
    width: '100%', // Largeur pleine
    backgroundColor: '#ffffff', // Couleur de fond du Picker
  },



  dateTextContainer: {
    borderRadius: 5,
    padding: 5,
    backgroundColor: '#d6d6d6',
    alignSelf: 'flex-start', // Ajuste la largeur au contenu
    elevation: 2,
    marginBottom: 10,
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 14,
    // marginLeft: 10,
    // marginBottom: 10,
    // backgroundColor: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  checkboxWrapper: {
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'column', // Les boutons seront côte à côte
    justifyContent: 'center', // Centrer horizontalement
    alignItems: 'center', // Centrer verticalement
    marginTop: 10,
    paddingBottom: 5,
  },
  mainButton: {
    backgroundColor: '#007bff', // Couleur identique
    padding: 15,
    borderRadius: 10,
    marginVertical: 5, // Espace entre les boutons
    alignItems: 'center',
    width: '95%', // Ajuster la largeur pour ne pas prendre toute la place
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  somespace: {
    // padding: 10,
    height: 20,
    // backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
  },
});