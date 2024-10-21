import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useAsyncStorage } from '../hooks/useAsyncStorage';

export default function HomeScreen({ navigation }) {
  const [shoppingHistory] = useAsyncStorage('shoppingHistory', []);

  const renderItem = ({ item }) => (
    <Button
      title={item.date}
      onPress={() => navigation.navigate('ShoppingListScreen', { historyItem: item })}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue dans PlanEat !</Text>
      <Button title="Bibliothèque de recettes" onPress={() => navigation.navigate('RecipeLibrary')} />
      <Button title="Planifier vos repas" onPress={() => navigation.navigate('MealPlanScreen')} />
      <Button title="Voir ma liste de courses" onPress={() => navigation.navigate('ShoppingListScreen')} />
      
      <Text style={styles.historyTitle}>Historique des listes de courses :</Text>
      <FlatList
        data={shoppingHistory}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.historyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  historyList: {
    width: '100%',
  },
});