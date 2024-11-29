import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const ImageBackgroundWrapper = ({ children, style, imageOpacity = 0.6 }) => {
  return (
    <ImageBackground
      source={require('../assets/images/trianglify-netlify-app.png')} // Image fixe
      style={[styles.background, style]} // Combine les styles si besoin
      imageStyle={{ opacity: imageOpacity }} // Utilisation du prop pour l'opacité
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
    background: {
      flex: 1, // Prendre toute la place
    },
  });

export default ImageBackgroundWrapper;
