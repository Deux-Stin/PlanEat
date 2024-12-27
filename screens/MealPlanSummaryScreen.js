import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, Modal, Alert, Dimensions } from "react-native";
import moment from "moment";
import * as Clipboard from "expo-clipboard";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MealPlanContext } from "./MealPlanContext";
import { useAsyncStorage } from "../hooks/useAsyncStorage";
import ImageBackgroundWrapper from "../components/ImageBackgroundWrapper"; // Import du wrapper
import { globalStyles } from "../globalStyles";
const { width, height } = Dimensions.get("window");

export default function MealPlanSummaryScreen({ route, navigation }) {
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage("backgroundIndex", 0); //Recupère l'index du background
  const [mealPlanFromAssignation, setMealPlanFromAssignation] = useAsyncStorage("mealPlanFromAssignation", {});

  const { mealPlan, setMealPlan } = useContext(MealPlanContext);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Récupérez les recettes depuis le fichier JSON local
  const [recipes] = useAsyncStorage("recipes", []); // 'recipes' correspond à la clé utilisée dans votre fichier

  // Utiliser useEffect pour mettre à jour le mealPlan avec les données passées via route.params
  useEffect(() => {
    if (route.params?.mealPlan) {
      setMealPlan(route.params.mealPlan);
    }

    if (route.params?.mealPlanFromAssignation) {
      setMealPlan(route.params.mealPlanFromAssignation);
      console.log("MealPlan mis à jour depuis MealAssignmentScreen");
    }
  }, [route.params?.mealPlan, route.params?.mealPlanFromAssignation]);

  const handleBack = () => {
    console.log("Retour avec le plan modifié");
    // navigation.navigate("MealAssignmentScreen", { mealPlanFromAssignation: mealPlan });
    navigation.navigate("MealAssignmentScreen", { fromMealPlanSummaryScreen: true });
  };

  useEffect(() => {
    // Vérifiez d'où provient la navigation avant de configurer le bouton retour
    const canGoBack = navigation.canGoBack();

    // console.log("canGoBack", canGoBack);
    // console.log("route.params?.fromMealPlanSummaryScreen", route.params?.fromMealPlanSummaryScreen);
    // Si la page précédente est MealPlanAssignmentScreen, vous envoyez la variable
    if (canGoBack && route.params?.fromMealPlanSummaryScreen) {
      console.log("test canGoBack");
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack}>
            <Icon name="arrow-left" size={25} color="#000" marginLeft={15} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, route.params]);

  const handleServingsChange = (date, mealType, category, newServings) => {
    setMealPlan((prevMealPlan) => {
      const updatedMealPlan = { ...prevMealPlan };
      if (mealType === "breakfast" || mealType === "apéritif" || mealType === "cocktail") {
        updatedMealPlan[date][mealType].servingsSelected = newServings;
      } else {
        updatedMealPlan[date][mealType][category].servingsSelected = newServings;
      }
      return updatedMealPlan;
    });
  };

  const renderMealItem = (date, mealType, category, name, servingsSelected) => {
    if (!name || servingsSelected === undefined) return null;

    return (
      <View key={category} style={styles.mealItem}>
        <Text style={styles.mealItemLabel}>{category.charAt(0).toUpperCase() + category.slice(1)} :</Text>
        <TouchableOpacity
          style={styles.mealItemValue}
          onPress={() => {
            const recipe = recipes.find((r) => r.name === name); // Trouve la recette dans la liste
            if (recipe) {
              navigation.navigate("RecipeDetail", { recipe, showPaniers : false});
            }
          }}
        >
          <Text style={styles.mealName}>{name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.portionSelector}
          onPress={() => {
            setSelectedDate(date);
            setSelectedMealType(mealType);
            setSelectedCategory(category);
            setShowPortionModal(true);
          }}
        >
          <Text style={styles.portionText}>{servingsSelected}p</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMealsByType = (date, mealType, label) => {
    const meal = mealPlan[date][mealType];
    if (!meal) return null;

    const categories =
      mealType === "breakfast"
        ? ["breakfast"]
        : mealType === "apéritif"
        ? ["apéritif"]
        : mealType === "cocktail"
        ? ["cocktail"]
        : ["entrée", "plat", "dessert"]; // Pour les autres types de repas

    return (
      <View key={mealType}>
        <Text style={styles.mealHeader}>{label} :</Text>
        {categories.map((category) => {
          const item = meal[category] || meal;
          return item ? renderMealItem(date, mealType, category, item.name, item.servingsSelected) : null;
        })}
      </View>
    );
  };

  const generateMealPlanSummary = () => {
    return Object.keys(mealPlan)
      .sort((a, b) => new Date(a) - new Date(b)) // Trier les dates par ordre croissant
      .map((date) => {
        const formattedDate = `${moment(date).format("DD/MM/YYYY")} - ${
          moment(date).format("dddd").charAt(0).toUpperCase() + moment(date).format("dddd").slice(1)
        }`;

        return (
          <View key={date} style={styles.dateSection}>
            <Text style={styles.dateText}>{formattedDate} :</Text>
            {renderMealsByType(date, "breakfast", "Petit déjeuner")}
            {renderMealsByType(date, "apéritif", "Apéritif")}
            {renderMealsByType(date, "lunch", "Déjeuner")}
            {renderMealsByType(date, "dinner", "Dîner")}
            {renderMealsByType(date, "cocktail", "Cocktail")}
          </View>
        );
      });
  };

  const generateSummaryText = () => {
    let summary = "Résumé de vos repas :\n\n";
  
    Object.keys(mealPlan).forEach((date) => {
      const formattedDate = moment(date).format("DD-MM-YYYY");
      summary += `${formattedDate} :\n`;
  
      // Parcours des types de repas
      ["apéritif", "breakfast", "lunch", "dinner", "cocktail"].forEach((mealType) => {
        const meal = mealPlan[date][mealType];
        if (meal) {
          // Titre du repas
          const mealTitle =
            mealType === "breakfast"
              ? "Petit-déjeuner"
              : mealType === "apéritif"
              ? "Apéritif"
              : mealType === "cocktail"
              ? "Cocktail"
              : mealType === "lunch"
              ? "Déjeuner"
              : "Dîner";
  
          summary += `  ${mealTitle} :\n`;
  
          // Gestion des types simples (apéritif, breakfast, cocktail)
          if (["apéritif", "breakfast", "cocktail"].includes(mealType)) {
            if (meal.name && meal.servingsSelected !== undefined) {
              summary += `    ${meal.name} - ${meal.servingsSelected}p\n\n`;
            } else {
              summary += `    Aucun plat sélectionné\n`;
            }
          } else {
            // Gestion des types complexes (lunch, dinner)
            ["entrée", "plat", "dessert"].forEach((category) => {
              const item = meal[category];
              if (item && item.name && item.servingsSelected !== undefined) {
                summary += `    ${category.charAt(0).toUpperCase() + category.slice(1)} : ${item.name} - ${
                  item.servingsSelected
                }p\n\n`;
              }
            });
          }
        }
      });
  
      summary += "\n";
    });
  
    return summary;
  };
  
  // Fonction pour copier le résumé dans le presse-papier
  const copyToClipboard = () => {
    const summaryText = generateSummaryText();
    Clipboard.setStringAsync(summaryText); // Copie le texte dans le presse-papier
    Alert.alert("Bonne nouvelle !", "\nVotre résumé des repas a été copié dans le presse-papier !"); // Optionnel: un message d'alerte
    console.log(summaryText);
  };

  return (
    <ImageBackgroundWrapper backgroundIndex={backgroundIndex} imageOpacity={0.6}>
      <ScrollView style={styles.container}>
        <Text style={[styles.sectionTitle, globalStyles.textTitleDeux]}>Résumé de vos repas</Text>
        {generateMealPlanSummary()}

        <Modal visible={showPortionModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => {
                    handleServingsChange(selectedDate, selectedMealType, selectedCategory, num);
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

        <View style={styles.section}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.mainButton, { marginTop: 50 }]}
              onPress={() => navigation.navigate("MealPlanScreen", { mealPlan: mealPlan })}
            >
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Modifier le plan de repas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainButton} onPress={copyToClipboard}>
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Copier le résumé</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => navigation.navigate("ShoppingListScreen", { mealPlan })}
            >
              <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Voir ma liste de courses</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  section: {
    width: "100%",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    // fontWeight: 'bold',
    color: "#444",
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    textAlign: "center",
  },
  dateSection: {
    marginVertical: 5,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  dateText: {
    // fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    // width: 150,
    alignSelf: "flex-start", // Le texte occupera uniquement l'espace nécessaire
    padding: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  mealHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 10,
  },
  // mealItem: {
  //   borderBottomWidth: 0.25,
  //   borderBottomColor: "#bdbdbd",
  //   flexDirection: "row",
  //   // alignItems: "center",
  //   marginVertical: 5,
  //   marginLeft: 20,
  //   flexWrap: "wrap",
  //   justifyContent: "space-between",
  // },
  mealItem: {
    flexDirection: "row",
    alignItems: "center", // Aligner les éléments verticalement au centre
    marginVertical: 5,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  mealName: {
    fontSize: 16,
  },
  // mealItemLabel: {
  //   // width: width * 0.2, // Fixe la largeur des labels
  //   // fontWeight: 'bold',
  //   fontSize: 16,
  //   marginHorizontal: 5,
  // },
  mealItemLabel: {
    width: '25%', // Fixe la largeur des étiquettes (par exemple, "Entrée", "Plat")
    fontSize: 16,
    // fontWeight: "bold",
    // marginRight: 10,
    marginLeft: 20,
  },
  mealItemValue: {
    flex: 1, // Prend le reste de l'espace disponible
    fontSize: 16,
    // borderLeftWidth: 2,
    // borderLeftColor: "#ddd",
  },
  portionSelector: {
    // width: 40,
    alignSelf: "flex-end", // Le texte occupera uniquement l'espace nécessaire
    // height: 30,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 5,
    backgroundColor: "#d6d6d6",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  portionText: {
    fontWeight: "bold",
    color: "#333",
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
    // marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    padding: 10,
    textAlign: "center",
    // alignSelf: "flex-end",  // Le texte occupera uniquement l'espace nécessaire
  },
  modalCancel: {
    marginTop: 10,
    fontSize: 16,
    color: "#ff3333",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 5,
  },
  mainButton: {
    backgroundColor: "#fff",
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: "center",
    width: "95%",
  },
  mainButtonText: {
    color: "#000",
    fontSize: 18,
    // fontWeight: 'bold',
    textAlign: "center",
  },
});
