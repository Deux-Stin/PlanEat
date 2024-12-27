import React, { useRef, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAsyncStorage } from "../hooks/useAsyncStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable } from "react-native-gesture-handler";
import { globalStyles } from "../globalStyles";
import moment from "moment";
import ImageBackgroundWrapper from "../components/ImageBackgroundWrapper"; // Import du wrapper

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [mealPlanHistory, setmealPlanHistory] = useAsyncStorage("mealPlanHistory", []);
  const [backgroundIndex, setBackgroundIndex] = useAsyncStorage("backgroundIndex", Math.floor(Math.random() * 10)); // Sauvegarde l'index du fond avec un random pour l'initialisation

  const swipeableRefs = useRef([]);

  useFocusEffect(
    React.useCallback(() => {
      loadmealPlanHistory();
    }, [])
  );

  // Fonction pour sélectionner un fond aléatoire et sauvegarder le choix
  const selectRandomBackground = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 10); // Nombre aléatoire entre 0 et 9
    setBackgroundIndex(randomIndex); // Sauvegarde l'index dans AsyncStorage
  }, [setBackgroundIndex]);

  const loadmealPlanHistory = async () => {
    try {
      const value = await AsyncStorage.getItem("mealPlanHistory");
      if (value !== null) {
        const parsedHistory = JSON.parse(value);
        console.log("Chargement de mealPlanHistory :", parsedHistory); // Vérifiez le contenu ici
        setmealPlanHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique", error);
    }
  };

  const deleteHistoryItem = async (itemToDelete) => {
    const updatedHistory = mealPlanHistory.filter((item) => item !== itemToDelete);
    setmealPlanHistory(updatedHistory);
    await AsyncStorage.setItem("mealPlanHistory", JSON.stringify(updatedHistory));
  };

  const renderRightActions = (item, index) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        Alert.alert("Confirmation", "Êtes-vous sûr de vouloir supprimer cette entrée ?", [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", onPress: () => deleteHistoryItem(item) },
        ]);
      }}
    >
      <Text style={styles.deleteButtonText}>Supprimer</Text>
    </TouchableOpacity>
  );

  const showInfoAlert = () => {
    Alert.alert(
      "Information",
      "\nCette application vous permet d'enregistrer vos recettes, d'en importer de nouvelles ou bien de les partager avec vos proches.\n\nElle permet également de planifier vos repas sur une plage calendaire et de générer votre liste de courses en fonction de vos menus et du nombre de portions.\n\nBonne utilisation ! \n\n\n\nPour toute suggestion/bug n'hésitez pas à me contacter : dustyn.naya@gmail.com"
    );
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
      ref={(ref) => (swipeableRefs.current[index] = ref)}
    >
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => handleClickInList(item)} // Ajout de l'élément cliqué
      >
        <Text style={styles.historyButtonText}>{item.title}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  const handleClickInList = (item) => {
    console.log(item);
    if (item.mealPlan && "2000-01-01" in item.mealPlan) {
      console.log("Clé '2000-01-01' trouvée dans mealPlan :", item.mealPlan["2000-01-01"]);

      console.log("Navigation vers ShoppingListScreen avec :", item);

      // Naviguer vers ShoppingListScreen
      navigation.navigate("ShoppingListScreen", {
        mealPlan: item.mealPlan,
        date: item.date,
      });
    } else {
      console.log("Element cliqué:", item); // Debug
      navigation.navigate("MealPlanSummaryScreen", {
        mealPlan: item.mealPlan,
        date: item.date,
      });
    }
  };

  return (
    <ImageBackgroundWrapper backgroundIndex={backgroundIndex} imageOpacity={0.6}>
      <View>
        {/* Bouton pour changer le fond */}
        <TouchableOpacity onPress={selectRandomBackground} style={styles.changeBackgroundButton}>
          <Text style={styles.changeBackgroundText}>🎨</Text>
        </TouchableOpacity>

        {/* Bouton d'information */}
        <TouchableOpacity onPress={showInfoAlert} style={styles.infoButton}>
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>

        <FlatList
          data={mealPlanHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.historyList}
          ListHeaderComponent={() => (
            <View style={styles.container}>
              <Text style={[styles.title, globalStyles.textTitleUn]}>Bienvenue dans PlanEat</Text>

              {/* Section des boutons */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, globalStyles.textTitleDeux]}>Accès rapide</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => navigation.navigate("RecipeLibrary", { refresh: true })}
                  >
                    <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Bibliothèque de recettes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => navigation.navigate("MealPlanScreen", { fromHome: true })}
                  >
                    <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Planifier vos repas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => {
                      if (mealPlanHistory && mealPlanHistory.length > 0) {
                        const sortedHistory = [...mealPlanHistory].sort(
                          (a, b) => moment(b.date, "DD/MM/YYYY à HH:mm") - moment(a.date, "DD/MM/YYYY à HH:mm")
                        );
                        const lastMealPlan = sortedHistory[0].mealPlan;
                        const dateLastMealPlan = sortedHistory[0].date;

                        console.log("Dernier MealPlan: ", dateLastMealPlan, " lastMealPlan ", lastMealPlan);
                        navigation.navigate("ShoppingListScreen", {
                          mealPlan: lastMealPlan,
                          date: dateLastMealPlan,
                        });
                      } else {
                        // Afficher un message si l'historique est vide
                        Alert.alert(
                          "Aucune liste de courses disponible",
                          "Vous n'avez pas encore de plan de repas dans l'historique."
                        );
                      }
                    }}
                  >
                    <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>
                      Voir ma dernière liste de courses
                    </Text>
                  </TouchableOpacity>

                  {/* Nouveau bouton pour accéder au calendrier des fruits et légumes */}
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => navigation.navigate("SeasonalCalendarScreen")}
                  >
                    <Text style={[styles.mainButtonText, globalStyles.textTitleTrois]}>Calendrier de saison</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section historique */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, globalStyles.textTitleDeux]}>Historique des listes de courses</Text>
              </View>
            </View>
          )}
        />
        <View style={styles.somespace} />
      </View>
    </ImageBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: height * 0.08,
    padding: 10,
    // backgroundColor: '#fff',
    alignItems: "center",
  },
  title: {
    fontSize: 120,
    marginTop: 50,
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 40,
    // fontWeight: 'bold',
    color: "#444",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  mainButton: {
    backgroundColor: "#fff",
    opacity: 0.8,
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: "center",
    width: "100%",
  },
  mainButtonText: {
    color: "#000",
    fontSize: 18,
    // fontWeight: 'bold',
    textAlign: "center",
  },
  historyList: {
    width: "100%",
  },
  historyButton: {
    height: 40, // avoir la même taille que le bouton supprimer
    paddingVertical: 10,
    paddingHorizontal: '2%',
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 5,
    marginHorizontal: '2%',
    justifyContent: "center",
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 14,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "red",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 80,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  somespace: {
    height: 5,
    // backgroundColor: '#fff',
  },
  changeBackgroundButton: {
    position: "absolute",
    zIndex: 10, // S'assurer que le bouton est au-dessus
    top: height * 0.05, // Par exemple, 5% de la hauteur de l'écran
    left: width * 0.05, // 5% de la largeur de l'écran width: 40,
    height: 50,
    // width: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    // elevation: 4, // Ombre pour Android
  },
  changeBackgroundText:{
    fontSize : 35,
  },
  infoButton: {
    position: "absolute",
    zIndex: 10, // Ajout d'un zIndex pour le rendre au-dessus
    top: height * 0.05,
    right: width * 0.05, // Ajuste la position pour qu'il ne soit pas superposé avec le bouton menu
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#ccc", // Couleur du bouton d'information
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  infoButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
});
