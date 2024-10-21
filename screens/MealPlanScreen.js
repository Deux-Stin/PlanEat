import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import 'moment/locale/fr';
import moment from 'moment';

moment.locale('fr');

export default function MealPlanScreen({ navigation }) {
  const [selectedDates, setSelectedDates] = useState({});
  const [mealsSelection, setMealsSelection] = useState({});
  const [mealPlan, setMealPlan] = useAsyncStorage('mealPlan', {});
  const [recipes] = useAsyncStorage('recipes', []);

  const mealTypeToCategory = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
  };

  const handleDayPress = (day) => {
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

  const handleMealCheckboxChange = (date, meal) => {
    const newMealsSelection = { ...mealsSelection };
    newMealsSelection[date] = {
      ...newMealsSelection[date],
      [meal]: !newMealsSelection[date]?.[meal],
    };
    setMealsSelection(newMealsSelection);

    if (!newMealsSelection[date][meal]) {
      setMealPlan((prevMealPlan) => {
        const updatedMealPlan = { ...prevMealPlan };
        if (updatedMealPlan[date] && updatedMealPlan[date][meal]) {
          delete updatedMealPlan[date][meal];
          if (Object.keys(updatedMealPlan[date]).length === 0) {
            delete updatedMealPlan[date];
          }
        }
        return updatedMealPlan;
      });
    }
  };

  const handleRecipeSelection = (date, mealType, recipeName) => {
    const selectedRecipe = recipes.find((recipe) => recipe.name === recipeName);
    console.log(`Selected Recipe for ${mealType} on ${date}:`, selectedRecipe);
    setMealPlan((prevMealPlan) => ({
      ...prevMealPlan,
      [date]: {
        ...prevMealPlan[date],
        [mealType]: selectedRecipe,
      },
    }));
  };

  const handleSaveMealPlan = () => {
  // Vérification si des repas ont été sélectionnés
  const hasMealsSelected = Object.keys(mealPlan).some(date => 
    mealPlan[date].breakfast || mealPlan[date].lunch || mealPlan[date].dinner
  );

    if (!hasMealsSelected) {
      alert('Veuillez sélectionner au moins un repas avant de générer la liste de courses.');
      return; // Arrêtez la fonction si aucun repas n'est sélectionné
    }

    // Naviguez vers la liste de courses si des repas sont sélectionnés
    navigation.navigate('ShoppingListScreen');
  };

  // Fonction pour filtrer les recettes selon le type de repas
  const filterRecipesByMealType = (mealType) => {
    const category = mealTypeToCategory[mealType];
    return recipes.filter(recipe =>
      Array.isArray(recipe.category) ? recipe.category.includes(category) : recipe.category === category
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text variant="headlineMedium" style={styles.title}>
          Planifier vos repas
        </Text>

        <Calendar
          current={new Date().toISOString().split('T')[0]}
          onDayPress={handleDayPress}
          markedDates={selectedDates}
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

        <View style={styles.mealSelection}>
          <Text variant="titleLarge" style={styles.mealTitle}>
            Sélection des repas
          </Text>

          {Object.keys(selectedDates).length > 0 ? (
            Object.keys(selectedDates).map((date) => (
              <View key={date} style={styles.mealSection}>
                <Text style={styles.dateText}>Date : {date}</Text>

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
                    <View key={mealType}>
                      <Text>Sélectionnez une recette pour le {mealTypeToCategory[mealType].toLowerCase()}</Text>
                      <Picker
                        selectedValue={mealPlan[date]?.[mealType]?.name || ''}
                        onValueChange={(itemValue) => handleRecipeSelection(date, mealType, itemValue)}
                      >
                        <Picker.Item label="Sélectionner une recette" value="" />
                        {filterRecipesByMealType(mealType).map((recipe, index) => (
                          <Picker.Item key={index} label={recipe.name} value={recipe.name} />
                        ))}
                      </Picker>
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

      {/* Bouton fixe en bas */}
      <Button mode="contained" onPress={handleSaveMealPlan} style={styles.saveButton}>
        Enregistrer et générer la liste de courses
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 100, // Pour laisser de l'espace pour le bouton fixe
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
  },
  dateText: {
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  checkboxWrapper: {
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 10,
  },
});
