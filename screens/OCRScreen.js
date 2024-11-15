import React, { useState, useEffect } from 'react';
import { View, Text, Button, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TesseractOcr from 'react-native-tesseract-ocr';

const OCRScreen = () => {
  const [imageUri, setImageUri] = useState(null);
  const [text, setText] = useState('');

  // Fonction pour ouvrir la bibliothèque ou l'appareil photo
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct usage of MediaTypeOptions.Images
      allowsEditing: false,
      quality: 1,
    });

    if (!result.cancelled) {
      setImageUri(result.uri);
      runOCR(result.uri);
    }
  };

  // Fonction pour ouvrir l'appareil photo
  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.cancelled) {
      setImageUri(result.uri);
      runOCR(result.uri);
    }
  };

  // Fonction de reconnaissance OCR
  const runOCR = async (uri) => {
    const tessOptions = {
      whitelist: null,  // Liste blanche des caractères à reconnaître (si nécessaire)
      blacklist: null,  // Liste noire des caractères à ignorer (si nécessaire)
    };

    try {
      const ocrResult = await TesseractOcr.recognize(uri, 'fra', tessOptions); // Langue française
      setText(ocrResult);
    } catch (error) {
      console.error('Erreur OCR:', error);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestStoragePermission();
    }
  }, []);

  // Demande de permission pour accéder à la galerie ou à l'appareil photo
  const requestStoragePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission d\'accès aux photos refusée');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Choisir une image depuis la galerie" onPress={pickImage} />
      <Button title="Prendre une photo" onPress={takePhoto} />
      {imageUri && <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />}
      {text && <Text>Texte reconnu : {text}</Text>}
    </View>
  );
};

export default OCRScreen;
