import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker'; // Pour choisir depuis les téléchargements
import TextRecognition from '@react-native-ml-kit/text-recognition';
import RNFS from 'react-native-fs'; // Pour lire des fichiers en base64 (si nécessaire)

export default function OCRScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');

  // Demander les permissions nécessaires (Android)
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permission d\'accès au stockage',
          message: 'Cette application a besoin d\'accéder aux fichiers.',
          buttonNeutral: 'Plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permission refusée');
      }
    }
  };

  useEffect(() => {
    requestStoragePermission(); // Demander la permission au chargement du composant
  }, []);

  // Fonction pour capturer une photo
  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 1,
    });

    if (!result.didCancel) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processImage(uri); // Appel pour reconnaître le texte
    }
  };

  // Fonction pour choisir une image depuis la galerie
  const chooseFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (!result.didCancel) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processImage(uri); // Appel pour reconnaître le texte
    }
  };

  // Fonction pour choisir un fichier depuis le dossier de téléchargements
  const chooseFromDownloads = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf], // Vous pouvez ajuster les types selon vos besoins
      });
      const uri = res.uri;
      setImageUri(uri);
      processImage(uri); // Appel pour reconnaître le texte
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Sélection annulée');
      } else {
        console.error('Erreur de sélection de fichier :', err);
      }
    }
  };

  // Fonction pour traiter l'image avec Google ML Kit (base64 si nécessaire)
    const processImage = async (uri) => {
      console.log('Image URI:', uri); // Ajoutez cette ligne pour voir l'URI dans la console
      try {
        const result = await TextRecognition.processImage(uri);
        setRecognizedText(result.text || 'Aucun texte détecté.');

        for (let block of result.blocks) {
          console.log('Block text:', block.text);
          console.log('Block frame:', block.frame);

          for (let line of block.lines) {
            console.log('Line text:', line.text);
            console.log('Line frame:', line.frame);
          }
        }

      } catch (error) {
        console.error('Erreur OCR :', error);
        setRecognizedText('Erreur lors de la reconnaissance.');
      }
    };


  return (
    <View style={styles.container}>
      <Button title="Prendre une photo" onPress={takePhoto} />
      <Button title="Choisir depuis la galerie" onPress={chooseFromGallery} />
      <Button title="Choisir depuis les téléchargements" onPress={chooseFromDownloads} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Text style={styles.text}>
        {recognizedText || 'Aucun texte détecté pour l’instant.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 16,
  },
  text: {
    marginTop: 16,
    textAlign: 'center',
    color: '#333',
  },
});
