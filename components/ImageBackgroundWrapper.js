import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const ImageBackgroundWrapper = ({ children, style, backgroundIndex, imageOpacity = 0.6 }) => {
  // Tableau des chemins d'image
  const backgrounds = [
    require('../assets/images/background_0.png'),
    require('../assets/images/background_1.png'),
    require('../assets/images/background_2.png'),
    require('../assets/images/background_3.png'),
    require('../assets/images/background_4.png'),
    require('../assets/images/background_5.png'),
    require('../assets/images/background_6.png'),
    require('../assets/images/background_7.png'),
    require('../assets/images/background_8.png'),
    require('../assets/images/background_9.png'),
  ];

  return (
    <ImageBackground
      source={backgrounds[backgroundIndex]} // Utilise l'image sélectionnée
      style={[styles.background, style]}
      imageStyle={{ opacity: imageOpacity }}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1, // Prendre toute la place
    // resizeMode: 'cover', // Remplit sans déformer
  },
});

export default ImageBackgroundWrapper;
