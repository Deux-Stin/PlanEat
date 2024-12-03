import React, { useState, useEffect, useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native'; 
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text, Button, Checkbox, BottomNavigation } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { MealPlanContext, MealPlanProvider } from './MealPlanContext';
import 'moment/locale/fr';
import moment from 'moment';
moment.locale('fr');
import ImageBackgroundWrapper from '../components/ImageBackgroundWrapper'; // Import du wrapper

LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre'
  ],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';


export default function MealPlanScreen({ navigation, route }) {
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [mealsSelection, setMealsSelection] = useState({});
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const { mealPlan, setMealPlan } = useContext(MealPlanContext);
  const [recipes] = useAsyncStorage('recipes', []);

  // Obtenir la date actuelle
  const today = moment().format('YYYY-MM-DD');

  // Permet de récupérer des états passés par d'autres pages :
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.fromHome) {
        resetSelections();
        route.params.fromHome = false;
      }
    }, [route.params])
  );

  useEffect(() => {
    if (route.params?.mealPlan) {
      setMealPlan(route.params.mealPlan);
    }
  }, [route.params?.mealPlan]);

  useEffect(() => {
    if (mealPlan) {
      const updatedSelectedDates = Object.keys(mealPlan).reduce((acc, date) => {
        acc[date] = { selected: true, selectedColor: '#b1d7ff' };
        return acc;
      }, {});
      setSelectedDates(updatedSelectedDates);
    }
  }, [mealPlan]);

  // Utilisez un effet pour initialiser mealsSelection uniquement lors du chargement de mealPlan
  useEffect(() => {
    const newMealsSelection = {};

    Object.keys(mealPlan || {}).forEach((date) => {
      const meals = mealPlan[date];
      newMealsSelection[date] = {
        breakfast: !!meals?.breakfast,
        lunch: !!meals?.lunch,
        dinner: !!meals?.dinner,
      };
    });

    setMealsSelection(newMealsSelection);
  }, [mealPlan]);

  // Initialise les portions si elles ne sont pas définies, sans mettre mealPlan à jour à chaque rendu
  useEffect(() => {
    let needsUpdate = false;
    const newMealPlan = { ...mealPlan };

    Object.keys(mealPlan || {}).forEach((date) => {
      const meals = mealPlan[date];

      if (meals?.breakfast && !meals.breakfast.servingsSelected) {
        newMealPlan[date] = {
          ...newMealPlan[date],
          breakfast: { ...meals.breakfast, servingsSelected: 2 },
        };
        needsUpdate = true;
      }

      if (meals?.lunch && !meals.lunch.servingsSelected) {
        newMealPlan[date] = {
          ...newMealPlan[date],
          lunch: { ...meals.lunch, servingsSelected: 2 },
        };
        needsUpdate = true;
      }

      if (meals?.dinner && !meals.dinner.servingsSelected) {
        newMealPlan[date] = {
          ...newMealPlan[date],
          dinner: { ...meals.dinner, servingsSelected: 2 },
        };
        needsUpdate = true;
      }
    });

    // Mise à jour de mealPlan uniquement si des changements sont nécessaires
    if (needsUpdate) {
      setMealPlan(newMealPlan);
    }
  }, [mealPlan]);


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
      newSelectedDates[day.dateString] = { selected: true, selectedColor: '#b1d7ff' };
    }
    setSelectedDates(newSelectedDates);
  };

  const handleMealCheckboxChange = async (date, meal) => {
    const newMealsSelection = { ...mealsSelection };
  
    // Si le repas est déjà sélectionné, on le désélectionne
    newMealsSelection[date] = {
      ...newMealsSelection[date],
      [meal]: !newMealsSelection[date]?.[meal], // Inverse la sélection
    };
  
    // Mise à jour de l'état des repas sélectionnés
    setMealsSelection(newMealsSelection);
  
    // Mise à jour de mealPlan pour ajouter ou supprimer le repas
    const updatedMealPlan = { ...mealPlan };
  
    // Si le repas est désélectionné, on le retire de mealPlan
    if (!newMealsSelection[date][meal]) {
      if (updatedMealPlan[date]) {
        delete updatedMealPlan[date][meal]; // Supprime le repas de mealPlan
        // Si aucun autre repas n'est présent pour cette date, on supprime la date
        if (!updatedMealPlan[date].breakfast && !updatedMealPlan[date].lunch && !updatedMealPlan[date].dinner) {
          delete updatedMealPlan[date];
        }
      }
    }
  
    // Si le repas est sélectionné, on ajoute un objet vide pour ce repas si nécessaire
    if (newMealsSelection[date][meal]) {
      if (!updatedMealPlan[date]) {
        updatedMealPlan[date] = {}; // Crée la date si elle n'existe pas
      }
      updatedMealPlan[date][meal] = {}; // On initialise un objet vide pour le repas sélectionné
    }
  
    // Mise à jour du mealPlan
    setMealPlan(updatedMealPlan);
  };
  
  const handleRecipeSelection = (date, mealType, recipeName, category) => { // Supprimez `portions` du paramètre
    if (!mealPlan[date]) {
      mealPlan[date] = {}; // Assure-toi que la date existe dans mealPlan
    }
    console.log('Sélectionner recette:', recipeName, 'pour', category);
    const selectedRecipe = recipes.find((recipe) => recipe.name === recipeName);
  
    setMealPlan((prevMealPlan) => {
      const updatedMealPlan = { ...prevMealPlan };
  
      // Vérifie si la date existe, sinon crée un objet vide
      if (!updatedMealPlan[date]) {
        updatedMealPlan[date] = {};
      }

      // Vérifie si le type de repas existe, sinon crée un objet vide
      if (!updatedMealPlan[date][mealType]) {
        updatedMealPlan[date][mealType] = {};
      }
  
      if (mealType === 'breakfast') {
        updatedMealPlan[date][mealType] = {
          ...selectedRecipe,
          servingsSelected: 2 // Valeur par défaut
        }
      } else {
        // Pour le déjeuner et dîner, assure que la catégorie (entrée, plat, dessert) existe
        if (!updatedMealPlan[date][mealType][category]) {
          updatedMealPlan[date][mealType][category] = {};
        }

        updatedMealPlan[date][mealType] = {
          ...updatedMealPlan[date][mealType],
          [category]: {
            ...selectedRecipe,
            servingsSelected: 2 // Valeur par défaut
          }
        };
      }
  
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
    console.log('mealPlan envoyé au MealPlanSummaryScreen :', mealPlan)
    navigation.navigate('MealPlanSummaryScreen', { mealPlan });
  };    

  const filterRecipesByMealType = (mealType) => {
  
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
        
        // Vérification si la catégorie est valide
        const validCategories = ['entrée', 'plat', 'dessert'];
        
        // Si la catégorie n'est pas valide, on ne traite pas et on retourne false pour éviter un bug
        if (!validCategories.includes(formattedCategory)) {
          console.warn(`Catégorie invalide détectée : ${formattedCategory}`);
          return false; // Retourne false pour éviter le traitement de catégories invalides
        }
        
        // Si la catégorie est valide, on continue le traitement
        return validCategories.includes(formattedCategory);
      }
      
  
      return false; // Si aucune des conditions n'est remplie, retourne false
    });
  };

  const filterRecipesByCategory = (category) => {
    return recipes.filter((recipe) => {
      // console.log('test2')
      // console.log('category :', category)
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
    // setPortions(2);
  };   
 
  // Cette fonction sert pour gérer le changement de portions
  const handleServingsChange = (date, mealType, category, newServings) => {
    setMealPlan((prevMealPlan) => {
      const updatedMealPlan = { ...prevMealPlan };
  
      // Vérification de l'existence de la date dans le plan de repas avant d'y ajouter les portions
      if (!updatedMealPlan[date]) {
        updatedMealPlan[date] = {};
      }
      
      // Vérification de l'existence du type de repas
      if (!updatedMealPlan[date][mealType]) {
        updatedMealPlan[date][mealType] = {}; // Crée le type de repas si nécessaire
      }      
  
      if (mealType === 'breakfast') {
        updatedMealPlan[date][mealType].servingsSelected = newServings;
      } else {
        // Pour le déjeuner ou dîner, on vérifie également la catégorie
        if (!updatedMealPlan[date][mealType][category]) {
          updatedMealPlan[date][mealType][category] = {}; // Crée la catégorie si elle n'existe pas
        }
        updatedMealPlan[date][mealType][category].servingsSelected = newServings;
      }
  
      return updatedMealPlan;
    });
  };
 

  return (
    <ImageBackgroundWrapper imageOpacity={0.6}>
    <MealPlanProvider>

    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.section}>
          <View style={styles.somespace}></View>
          {/* <Text style={styles.sectionTitle}>Planifier vos repas</Text> */}

          <Calendar
            current={today} // Affiche la date actuelle
            onDayPress={handleDayPress}
            markedDates={{ ...selectedDates, ...markedDates }}
            hideExtraDays={true}
            enableSwipeMonths={true}
            renderArrow={(direction) => (
              <Text>{direction === 'left' ? '<' : '>'}</Text>
            )}
            monthFormat={'MMMM yyyy'}
            firstDay={1}
            style={{
              borderWidth: 1,
              borderColor: '#000',
              // height: 350,
            }}
          />
        </View>

          
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélection des repas</Text>

          {Object.keys(selectedDates).length > 0 ? (
            Object.keys(selectedDates).map((date) => (
              <View key={date} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  {/* Affichage de la date et des repas */}
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateText}>{moment(date).format('DD/MM/YYYY')}</Text>
                  </View>

                  {/* Affichage des repas */}
                  <View style={styles.mealTypesContainer}>
                    <View style={styles.mealTypeWrapper}>
                      <Text>Petit-déjeuner</Text>
                      <Checkbox
                        status={mealsSelection[date]?.breakfast ? 'checked' : 'unchecked'}
                        onPress={() => handleMealCheckboxChange(date, 'breakfast')}
                      />
                    </View>

                    <View style={styles.mealTypeWrapper}>
                      <Text>Déjeuner</Text>
                      <Checkbox
                        status={mealsSelection[date]?.lunch ? 'checked' : 'unchecked'}
                        onPress={() => handleMealCheckboxChange(date, 'lunch')}
                      />
                    </View>

                    <View style={styles.mealTypeWrapper}>
                      <Text>Dîner</Text>
                      <Checkbox
                        status={mealsSelection[date]?.dinner ? 'checked' : 'unchecked'}
                        onPress={() => handleMealCheckboxChange(date, 'dinner')}
                      />
                    </View>
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
                            <View style={styles.categoryTextWrapper}>
                              <Text style={styles.categoryText}>
                                {'Petit-Dej'}
                              </Text>
                            </View>
                          <Picker
                            style={styles.recipePicker}
                            selectedValue={mealPlan[date]?.[mealType]?.name || ''}
                            onValueChange={(itemValue) => handleRecipeSelection(date, mealType, itemValue, 'breakfast')}
                          >
                            <Picker.Item label="Sélectionner une recette" value="" style={styles.pickerItem}/>
                            {filterRecipesByMealType(mealType).map((recipe, index) => (
                              <Picker.Item key={index} label={recipe.name} value={recipe.name} style={styles.pickerItem} />
                            ))}
                          </Picker>

                          {/* Sélecteur de portions pour le petit-déjeuner */}
                          {mealPlan[date]?.[mealType]?.name && (
                            <TouchableOpacity style={styles.portionSelector} onPress={() => {
                              setShowPortionModal(true);
                              setSelectedCategory(null);
                              setSelectedMealType(mealType);
                              setSelectedDate(date);
                            }}>
                              <Text style={styles.portionText}>{mealPlan[date][mealType].servingsSelected || 2}p</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                      ) : (
                        ['entrée', 'plat', 'dessert'].map((category) => (
                          <View key={category} style={styles.pickerContainer}>
                            <View style={styles.categoryTextWrapper}>
                              <Text style={styles.categoryText}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </Text>
                            </View>

                            <Picker
                              style={styles.recipePicker}
                              selectedValue={mealPlan[date]?.[mealType]?.[category]?.name || ''}
                              onValueChange={(itemValue) => handleRecipeSelection(date, mealType, itemValue, category)} 
                            >
                              <Picker.Item label={`Sélectionner un(e) ${category}`} value="" />
                              {filterRecipesByCategory(category).map((recipe, index) => (
                                <Picker.Item key={index} label={recipe.name} value={recipe.name} />
                              ))}
                            </Picker>

                            {/* Sélecteur de portions pour entrée/plat/dessert */}
                            {mealPlan[date]?.[mealType]?.[category]?.name && (
                              <TouchableOpacity style={styles.portionSelector} onPress={() => {
                                setShowPortionModal(true);
                                setSelectedCategory(category);
                                setSelectedMealType(mealType);
                                setSelectedDate(date);
                              }}>
                                <Text style={styles.portionText}>{mealPlan[date][mealType][category].servingsSelected || 2}p</Text>
                              </TouchableOpacity>
                            )}
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

      {/* Modal pour sélectionner les portions */}
      <Modal visible={showPortionModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => {
                  handleServingsChange(selectedDate, selectedMealType, selectedCategory, num);
                  setShowPortionModal(false);
                }}
              >
                <Text style={styles.modalText}>{num}p</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowPortionModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Boutons fixes en bas */}
      <View style={styles.section}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleSaveMealPlan}>
            <Text style={styles.mainButtonText}>Voir mon récapitulatif</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={resetSelections}>
            <Text style={styles.mainButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>

    </MealPlanProvider>
    </ImageBackgroundWrapper>
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
  
  mealTitle: {
    fontWeight: 'bold',
  },
  mealSection: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    backgroundColor: '#fff',
    elevation: 5,
  },

  mealHeader: {
    flexDirection: 'row', // Date et repas sur la même ligne
    justifyContent: 'space-between', // Espacement entre les éléments
    alignItems: 'center',
    // marginBottom: 10,
  },
  dateTextContainer: {
    backgroundColor: '#d6d6d6',
    padding: 5,
    borderRadius: 5,
    elevation: 2,
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  mealTypesContainer: {
    flexDirection: 'row', // Checkbox sous chaque repas
    marginRight: 20,
  },
  mealTypeWrapper: {
    flexDirection: 'column', // Intitulé et checkbox sur la même ligne
    alignItems: 'center',
    // marginBottom: 10,
    marginHorizontal: 30,
    justifyContent: 'space-evenly',
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
    padding: 10,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  test:{
    // height:100,
  },
  pickerContainer:{
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 0,
    borderRadius: 5,
    elevation: 5,
    marginBottom: 5,
  },
  recipePicker: {
    flex: 1, // Prend l'espace restant
    height: 50,
  },

  portionSelector: {
    width: 50,
    height: 50,
    backgroundColor: '#d6d6d6',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,  // Ajoute un peu d'espace entre le picker et le sélecteur de portions
  },
  portionText: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 150,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalText: {
    fontSize: 18,
    padding: 10,
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff3333',
    textAlign: 'center',
  },
  
  categoryTextWrapper: {
    flexDirection: 'row',  // Assure-toi que le texte et le picker soient alignés horizontalement
    alignItems: 'center',  // Centrer verticalement le texte
    justifyContent: 'space-evenly',  // Centrer horizontalement si nécessaire
    // marginLeft: 10,
    width: 80,  // La largeur fixe du conteneur
    height: 50, // La hauteur fixe du conteneur
    marginLeft: 2,
    borderRadius: 5,
    backgroundColor: '#ebebeb',  // La couleur de fond
  },
  categoryText: {
    fontSize: 15,
    fontWeight: 'bold',
    margin: 0,  // Supprimer toute marge du texte
    padding: 0,  // Supprimer le padding autour du texte
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
    backgroundColor: '#fff',
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 5, // Espace entre les boutons
    alignItems: 'center',
    width: '95%', // Ajuster la largeur pour ne pas prendre toute la place
  },
  mainButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  somespace: {
    height: 20,
  },
});