import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import uuid from "react-native-uuid";
import { Alert, Platform } from "react-native";

const RecipeUtils = {
  /**
   * Importer des recettes depuis un fichier JSON ou TXT.
   * @returns {Promise<Array>} - Un tableau de recettes importées ou null en cas d'échec.
   */
  async importRecipes() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const { uri } = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(uri);

      let jsonData;
      try {
        // Tenter de parser directement comme JSON
        jsonData = JSON.parse(fileContent);
      } catch (e) {
        // Si ce n'est pas un JSON valide, traiter comme un fichier TXT structuré
        try {
          jsonData = parseTxtToJson(fileContent); // Fonction dédiée pour TXT
        } catch (txtError) {
          console.error("Erreur lors du traitement TXT :", txtError);
          Alert.alert("Erreur", "Le fichier TXT est mal formaté.");
          return null;
        }
      }

      // Vérification des données
      if (!jsonData || !Array.isArray(jsonData.recipes)) {
        console.error(
          "Le fichier importé ne contient pas de recettes valides."
        );
        Alert.alert(
          "Erreur",
          "Le fichier importé ne contient pas de recettes valides."
        );
        return null;
      }

      // Générer des IDs pour les recettes sans ID
      return jsonData.recipes.map((recipe) => ({
        ...recipe,
        id: recipe.id || uuid.v4(),
      }));
    } catch (error) {
      console.error("Erreur lors de l'importation :", error);
      Alert.alert("Erreur", "Impossible d'importer les recettes.");
      return null;
    }
  },

  /**
   * Exporter des recettes au format JSON ou TXT.
   * @param {Array} recipes - Les recettes à exporter.
   * @returns {Promise<boolean>} - Succès ou échec de l'export.
   */
  async exportRecipes(recipes) {
    try {
      const formatChoice = await RecipeUtils.askExportFormat();

      if (!formatChoice) return false;

      const fileName = `recipes.${formatChoice}`;
      const fileContent = RecipeUtils.formatRecipes(recipes, formatChoice);

      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission refusée",
            "Veuillez autoriser l'accès au stockage."
          );
          return false;
        }

        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              formatChoice === "json" ? "application/json" : "text/plain"
            );
          const readablePath = getReadablePath(fileUri);
          console.log("Chemin lisible :", readablePath);

          await FileSystem.writeAsStringAsync(fileUri, fileContent);
          Alert.alert(
            "Succès",
            `Les recettes ont été enregistrées dans :\n${readablePath}`
          );
          return true;
        }
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, fileContent);
        await Sharing.shareAsync(fileUri);
        return true;
      }
    } catch (error) {
      console.error("Erreur lors de l'export :", error);
      return false;
    }
  },

  /**
   * Ajouter de nouvelles recettes en vérifiant les doublons.
   * @param {Array} existingRecipes - Recettes existantes.
   * @param {Array} newRecipes - Nouvelles recettes.
   * @returns {Array} - Liste mise à jour des recettes.
   */
  addRecipes(existingRecipes, newRecipes) {
    const updatedRecipes = [...existingRecipes];
    newRecipes.forEach((recipe) => {
      const exists = updatedRecipes.some(
        (existing) => existing.id === recipe.id || existing.name === recipe.name
      );
      if (!exists) {
        updatedRecipes.push(recipe);
      }
    });
    return updatedRecipes;
  },

  /**
   * Demander le format d'exportation à l'utilisateur.
   * @returns {Promise<'json'|'txt'|null>} - Format choisi ou null si annulé.
   */
  askExportFormat() {
    return new Promise((resolve) => {
      Alert.alert(
        "Choisissez le format d'exportation",
        "Exporter les recettes au format :",
        [
          { text: "JSON", onPress: () => resolve("json") },
          { text: "TXT", onPress: () => resolve("txt") },
          { text: "Annuler", style: "cancel", onPress: () => resolve(null) },
        ]
      );
    });
  },

  /**
   * Convertir un contenu de fichier en JSON.
   * @param {string} fileContent - Contenu brut du fichier.
   * @returns {Object} - Données JSON.
   */
  parseTxtToJson(fileContent) {
    const lines = fileContent.split("\n");
    const recipes = [];
    let currentRecipe = {};

    lines.forEach((line) => {
      if (line.trim() === "") {
        // Nouvelle recette si une ligne est vide
        if (Object.keys(currentRecipe).length > 0) {
          recipes.push(currentRecipe);
          currentRecipe = {};
        }
      } else {
        const [key, value] = line.split(":");
        if (key && value) {
          currentRecipe[key.trim().toLowerCase()] = value.trim();
        }
      }
    });

    if (Object.keys(currentRecipe).length > 0) {
      recipes.push(currentRecipe); // Ajouter la dernière recette
    }

    return { recipes };
  },

  /**
   * Formater les recettes en fonction du format.
   * @param {Array} recipes - Recettes à formater.
   * @param {'json'|'txt'} format - Format souhaité.
   * @returns {string} - Chaîne formatée.
   */
  formatRecipes(recipes, format) {
    if (format === "json") {
      return JSON.stringify({ recipes }, null, 2);
    }
    return recipes
      .map((recipe) =>
        Object.entries(recipe)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      )
      .join("\n\n");
  },
};

getReadablePath = (fileUri) => {
  // Décoder l'URI
  const decodedUri = decodeURIComponent(fileUri);

  // Supprimer le préfixe principal
  const withoutPrefix = decodedUri.replace(
    "content://com.android.externalstorage.documents/tree/primary:",
    ""
  );

  // Trouver où commence la redondance après "document/primary:"
  const parts = withoutPrefix.split("document/primary:");
  if (parts.length > 1) {
    // S'assurer que la seconde partie n'est pas redondante avec la première
    if (parts[1].startsWith(parts[0])) {
      return parts[1]; // Garder seulement la deuxième partie
    }
  }

  // Si pas de redondance détectée, garder le chemin original nettoyé
  return withoutPrefix;
};

export default RecipeUtils;
