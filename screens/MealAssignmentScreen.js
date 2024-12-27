import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
  ScrollView,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useAsyncStorage } from "../hooks/useAsyncStorage";
import { globalStyles } from "../globalStyles";
import moment from "moment";
import ImageBackgroundWrapper from "../components/ImageBackgroundWrapper"; // Import du wrapper

const categories = ["Apéritif", "Petit-déjeuner", "Entrée", "Plat", "Dessert", "Cocktail"];
const { width, height } = Dimensions.get("window");

// Obtenir la date actuelle
const today = moment().format("YYYY-MM-DD");

export default function MealAssignmentScreen({ route, navigation }) {
  const [mealChoice, setMealChoice] = useAsyncStorage("mealChoice", []);
  const [mealPlanFromAssignation, setMealPlanFromAssignation] = useAsyncStorage("mealPlanFromAssignation", {});
  const [defaultServings, setDefaultServings] = useAsyncStorage("defaultServings", 2);
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage("backgroundIndex", 0); //Recupère l'index du background
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (route.params?.fromMealPlanSummaryScreen) {
      console.log("Rechargement de mealPlanFromAssignation après retour");
      setMealPlanFromAssignation((prevPlan) => ({ ...prevPlan })); // Recharge les données depuis useAsyncStorage
    }
  }, [route.params?.fromMealPlanSummaryScreen]);

  // Fonction pour formater la date au format XX/XX/XXXX
  const formatSelectedDate = (date) => {
    return date ? date.slice(8, 10) + "/" + date.slice(5, 7) + "/" + date.slice(0, 4) : "";
  };

  const openCalendar = (recipe) => {
    setSelectedRecipe(recipe);
    setIsModalVisible(true);
  };

  const markedDates = {};
  // Marquer les dates passées
  for (let i = 0; i < 365; i++) {
    // Limiter à 365 jours dans le passé
    const pastDate = moment(today)
      .subtract(i + 1, "days")
      .format("YYYY-MM-DD");
    markedDates[pastDate] = { disabled: true, selectedColor: "gray" };
  }

  const handleGoToResume = () => {
    // console.log("mealPlan envoyé au MealPlanSummaryScreen :", JSON.stringify(mealPlanFromAssignation, 2, null));
    console.log("mealPlanFromAssignation", mealPlanFromAssignation);
    // const mealPlan = mealPlanFromAssignation;
    navigation.navigate("MealPlanSummaryScreen", { mealPlanFromAssignation, fromMealPlanSummaryScreen: true });
  };

  const handleDayPress = (day) => {
    // Vérifier si la date sélectionnée est passée
    if (moment(day.dateString).isBefore(today)) {
      Alert.alert(
        "Hum, try again !",
        "Vous essayez vraiment de sélectionner une date du passé ? \n \nEssayez plutôt le turfu, ça a l'air sympa ! :)"
      );
      return; // Ne rien faire si la date est dans le passé
    }

    if (selectedRecipe) {
      const newDate = day.dateString;
      setSelectedDate(newDate); // Met à jour la date sélectionnée globalement.

      setMealPlanFromAssignation((prevPlan) => {
        const updatedPlan = { ...prevPlan };

        // Supprimer la recette des anciennes assignations
        Object.keys(updatedPlan).forEach((existingDate) => {
          // Pour les repas de type lunch et dinner
          ["lunch", "dinner"].forEach((mealType) => {
            const meal = updatedPlan[existingDate]?.[mealType]?.[selectedRecipe.category.toLowerCase()];
            if (meal?.instanceId === selectedRecipe.instanceId) {
              delete updatedPlan[existingDate][mealType][selectedRecipe.category.toLowerCase()];
              // Si le mealType est vide, on supprime le mealType de la date
              if (Object.keys(updatedPlan[existingDate][mealType] || {}).length === 0) {
                delete updatedPlan[existingDate][mealType];
              }
              // Si toutes les clés de la date sont vides, on supprime la date
              if (Object.keys(updatedPlan[existingDate]).length === 0) {
                delete updatedPlan[existingDate];
              }
            }
          });

          // Pour les catégories spéciales comme apéritif, breakfast et cocktail
          ["apéritif", "breakfast", "cocktail"].forEach((mealType) => {
            const meal = updatedPlan[existingDate]?.[mealType];
            console.log("meal", meal);
            if (meal?.instanceId === selectedRecipe.instanceId) {
              delete updatedPlan[existingDate][mealType];
              // Si le mealType est vide, on supprime la clé mealType
              if (Object.keys(updatedPlan[existingDate][mealType] || {}).length === 0) {
                delete updatedPlan[existingDate][mealType];
              }
              // Si toutes les clés de la date sont vides, on supprime la date
              if (Object.keys(updatedPlan[existingDate]).length === 0) {
                delete updatedPlan[existingDate];
              }
            }
          });
        });

        // Ajouter ou modifier la recette pour la nouvelle date
        if (!updatedPlan[newDate]) {
          updatedPlan[newDate] = {};
        }

        const targetMealType =
          selectedRecipe.category === "Petit-déjeuner"
            ? "breakfast"
            : selectedRecipe.category === "Apéritif"
            ? "apéritif"
            : selectedRecipe.category === "Cocktail"
            ? "cocktail"
            : Object.keys(updatedPlan[newDate]).includes("lunch")
            ? "dinner"
            : "lunch";

        if (!updatedPlan[newDate][targetMealType]) {
          updatedPlan[newDate][targetMealType] = {}; // Initialiser le type de repas s'il n'existe pas
        }

        if (["lunch", "dinner"].includes(targetMealType)) {
          updatedPlan[newDate][targetMealType][selectedRecipe.category.toLowerCase()] = {
            ...selectedRecipe,
            servingsSelected: defaultServings,
            // instanceId: uuid.v4(),
          };
        } else if (["petit-déjeuner", "apéritif", "cocktail"].includes(selectedRecipe.category.toLowerCase())) {
          updatedPlan[newDate][targetMealType] = {
            ...selectedRecipe,
            servingsSelected: defaultServings,
            // instanceId: uuid.v4(),
          };
        }

        return updatedPlan;
      });

      setSelectedRecipe(null);
      setIsModalVisible(false);
    }
  };

  const handleServingsChange = (date, category, newServings) => {
    if (!date || !category || !newServings) {
      console.warn("Invalid parameters for handleServingsChange:", { date, category, newServings });
      return;
    }

    setMealPlanFromAssignation((prevMealPlan) => {
      const updatedMealPlan = { ...prevMealPlan };

      // Identifier le type de repas en fonction de la catégorie
      let mealType;

      if (category === "Petit-déjeuner") {
        mealType = "breakfast";
      } else if (category.toLowerCase() === "apéritif") {
        mealType = "apéritif";
      } else if (category.toLowerCase() === "cocktail") {
        mealType = "cocktail";
      } else if (updatedMealPlan[date]?.lunch?.[category.toLowerCase()]) {
        mealType = "lunch";
      } else if (updatedMealPlan[date]?.dinner?.[category.toLowerCase()]) {
        mealType = "dinner";
      } else {
        console.warn(`No mealType found for date: ${date}, category: ${category}`);
        return prevMealPlan;
      }

      // Mettre à jour les portions
      if (mealType === "apéritif" || mealType === "breakfast" || mealType === "cocktail") {
        updatedMealPlan[date][mealType].servingsSelected = newServings;
        // console.log('updatedMealPlan[date][mealType].servingsSelected', updatedMealPlan[date][mealType].servingsSelected)
      } else if (mealType === "lunch" || mealType === "dinner") {
        updatedMealPlan[date][mealType][category.toLowerCase()].servingsSelected = newServings;
      } else {
        console.warn(`Category ${category} not found on date ${date}`);
      }

      console.log(JSON.stringify(mealPlanFromAssignation, 2, null));
      return updatedMealPlan;
    });
  };

  const getRecipesByCategory = (category) => mealChoice.filter((recipe) => recipe.category === category);

  const renderRecipeItem = ({ item }) => {
    let servings = defaultServings;
    let foundDate = null; // Stocke la date trouvée
    let foundMealType = null; // Stocke le type de repas trouvé (apéritif, lunch, etc.)

    Object.keys(mealPlanFromAssignation).some((date) => {
      const mealsForDate = mealPlanFromAssignation[date];

      // Vérifier dans les repas simples
      ["apéritif", "breakfast", "cocktail"].some((mealType) => {
        if (mealsForDate[mealType]?.instanceId === item.instanceId) {
          servings = mealsForDate[mealType]?.servingsSelected || defaultServings;
          foundDate = date;
          foundMealType = mealType;
          return true;
        }
        return false;
      });

      // Vérifier dans lunch/dinner avec sous-catégories
      ["lunch", "dinner"].some((mealType) => {
        const mealCategories = mealsForDate[mealType];
        if (mealCategories) {
          return Object.keys(mealCategories).some((subCategory) => {
            if (mealCategories[subCategory]?.instanceId === item.instanceId) {
              servings = mealCategories[subCategory]?.servingsSelected || defaultServings;
              foundDate = date;
              foundMealType = mealType;
              return true;
            }
            return false;
          });
        }
        return false;
      });

      return foundDate; // Arrêter la recherche si on a trouvé
    });

    return (
      <View style={styles.recipeItem}>
        <View style={styles.recipeInfo}>
          <TouchableOpacity style={styles.dateButton} onPress={() => openCalendar(item)}>
            <Text style={styles.recipeText}>
              {item.name} - {formatSelectedDate(foundDate) || "JJ/MM/AAAA"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.portionButton}
            onPress={() => {
              setSelectedDate(foundDate);
              setSelectedCategory(item.category);
              setShowPortionModal(true);
            }}
          >
            <Text style={styles.portionButtonText}>{servings}p</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ImageBackgroundWrapper backgroundIndex={backgroundIndex} imageOpacity={0.5}>
      <View style={styles.container}>
        {/* Liste principale défilable */}
        <FlatList
          data={categories}
          keyExtractor={(category) => category}
          renderItem={({ item: category }) => {
            const recipesInCategory = getRecipesByCategory(category);
            if (recipesInCategory.length === 0) return null; // Ne pas afficher la catégorie si elle est vide

            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <FlatList
                  data={recipesInCategory}
                  keyExtractor={(item) => item.instanceId}
                  renderItem={renderRecipeItem}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.listContentContainer} // Padding pour éviter le chevauchement
        />

        {/* Bouton fixe en bas */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleGoToResume}>
            <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Voir mon récapitulatif</Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainerCalendar}>
            <View style={styles.modalContentCalendar}>
              <Text style={[styles.modalTitle, globalStyles.textTitleTrois]}>Sélectionner une date pour :</Text>
              <Text style={[styles.modalTextRecipe, globalStyles.textTitleTrois]}>{selectedRecipe?.name}</Text>
              <Calendar
                current={today} // Affiche la date actuelle
                onDayPress={handleDayPress}
                markedDates={markedDates}
                hideExtraDays={true}
                enableSwipeMonths={true}
                renderArrow={(direction) => <Text>{direction === "left" ? "<" : ">"}</Text>}
                monthFormat={"MMMM yyyy"}
                firstDay={1}
                style={{
                  // flex: 1,
                  // paddingHorizontal: 10,
                  // justifyContent: 'center',
                  width: 0.8 * width,
                  // padding: 6,
                  // borderRadius: 20,
                  // borderWidth: 1,
                  // borderColor: "#000",
                  // height: 0.35 * height,
                }}
                theme={{
                  backgroundColor: "#ffffff",
                  calendarBackground: "#ffffff",
                  // textSectionTitleColor: '#b6c1cd',
                  // textSectionTitleDisabledColor: '#d9e1e8',
                  // selectedDayBackgroundColor: '#00adf5',
                  // selectedDayTextColor: '#ffffff',
                  // todayTextColor: '#00adf5',
                  // dayTextColor: '#2d4150',
                  // textDisabledColor: '#d9e1e8',
                  // dotColor: '#00adf5',
                  // selectedDotColor: '#ffffff',
                  // arrowColor: 'orange',
                  // disabledArrowColor: '#d9e1e8',
                  // monthTextColor: 'blue',
                  // indicatorColor: 'blue',
                  // textDayFontFamily: 'monospace',
                  // textMonthFontFamily: 'monospace',
                  // textDayHeaderFontFamily: 'monospace',
                  // textDayFontWeight: '300',
                  // textMonthFontWeight: 'bold',
                  // textDayHeaderFontWeight: '300',
                  // textDayFontSize: 16,
                  // textMonthFontSize: 16,
                  // textDayHeaderFontSize: 16
                }}
              />
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Annuler</Text>
              </TouchableOpacity>
              {/* <Button title="Cancel" onPress={() => setIsModalVisible(false)} /> */}
            </View>
          </View>
        </Modal>

        <Modal visible={showPortionModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => {
                    handleServingsChange(selectedDate, selectedCategory, num);
                    setShowPortionModal(false);
                  }}
                >
                  <Text style={styles.modalText}>{num} portions</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowPortionModal(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontSize: 20, fontWeight: "bold" },
  categorySection: {
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  listContentContainer: {
    paddingBottom: 100, // Espace pour éviter le chevauchement avec le bouton
  },
  recipeItem: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    margin: 2.5,
    borderRadius: 10,
  },
  recipeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeText: { fontSize: 16 },
  dateButton: { flex: 1 },
  portionButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#d6d6d6",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  portionButtonText: {
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContainerCalendar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContentCalendar: {
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 200,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalText: {
    fontSize: 20,
    padding: 10,
    textAlign: "center",
  },
  modalTextRecipe: {
    fontSize: 20,
    // fontWeight: "bold",
    marginTop: 10,
    padding: 10,
    textAlign: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  modalCancel: {
    marginTop: 10,
    fontSize: 16,
    color: "#ff3333",
    textAlign: "center",
  },
  summary: {
    // marginVertical: 20
  },
  summaryTitle: { fontSize: 18, fontWeight: "bold" },
  scrollContainer: {
    marginVertical: 20,
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 0, // Fixé en bas de l'écran
    left: 0,
    right: 0,
    // padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  mainButton: {
    position: "absolute",
    bottom: 10, // Position en bas
    left: 20, // Décalage gauche
    right: 20, // Décalage droit
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5, // Ombre (Android)
    shadowColor: "#000", // Ombre (iOS)
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainButtonText: {
    color: "#000",
    fontSize: 18,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#007bff",
    opacity: 0.9,
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    // fontWeight: "bold",
    textAlign: "center",
  },
});
