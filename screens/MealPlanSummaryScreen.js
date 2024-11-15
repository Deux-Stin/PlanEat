import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, Modal } from 'react-native';
import moment from 'moment';
import { MealPlanContext } from './MealPlanContext';

export default function MealPlanSummaryScreen({ route, navigation }) {
    const { mealPlan, setMealPlan } = useContext(MealPlanContext);
    const [showPortionModal, setShowPortionModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedMealType, setSelectedMealType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Utiliser useEffect pour mettre à jour le mealPlan avec les données passées via route.params
    useEffect(() => {
        if (route.params?.mealPlan) {
            setMealPlan(route.params.mealPlan);
        }
    }, [route.params?.mealPlan]);

    const handleServingsChange = (date, mealType, category, newServings) => {
        setMealPlan((prevMealPlan) => {
            const updatedMealPlan = { ...prevMealPlan };
            if (mealType === 'breakfast') {
                updatedMealPlan[date][mealType].servingsSelected = newServings;
            } else {
                updatedMealPlan[date][mealType][category].servingsSelected = newServings;
            }
            return updatedMealPlan;
        });
    };

    const renderMealItem = (date, mealType, category, name, servingsSelected) => {
        if (!name || servingsSelected === undefined) return null; // Si pas de recette ou pas de portions, ne rien afficher

        return (
            <View key={category} style={styles.mealItem}>
                <Text style={styles.mealName}>{`${category.charAt(0).toUpperCase() + category.slice(1)} : ${name}`}</Text>
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

        const categories = mealType === 'breakfast'
            ? ['breakfast']
            : ['entrée', 'plat', 'dessert'];

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
        return Object.keys(mealPlan).map((date) => {
            const formattedDate = moment(date).format("DD-MM-YYYY");

            return (
                <View key={date} style={styles.dateSection}>
                    <Text style={styles.dateText}>{formattedDate} :</Text>
                    {renderMealsByType(date, 'breakfast', 'Petit déjeuner')}
                    {renderMealsByType(date, 'lunch', 'Déjeuner')}
                    {renderMealsByType(date, 'dinner', 'Dîner')}
                </View>
            );
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Résumé de vos repas</Text>
            {generateMealPlanSummary()}

            <Modal visible={showPortionModal} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                            <TouchableOpacity
                                key={num}
                                onPress={() => {
                                    handleServingsChange(selectedDate, selectedMealType, selectedCategory, num);
                                    setShowPortionModal(false);
                                }}
                            >
                                <Text style={styles.modalText}>{num}p</Text>
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
                    <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('MealPlanScreen', { mealPlan: mealPlan })}>
                        <Text style={styles.mainButtonText}>Modifier le plan de repas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('ShoppingListScreen', { mealPlan })}>
                        <Text style={styles.mainButtonText}>Voir ma liste de courses</Text> 
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    section: {
        width: '100%',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    dateSection: {
        marginVertical: 5,
        padding: 8,
        backgroundColor: '#eae1e4',
        borderRadius: 8,
    },
    dateText: {
        fontWeight: 'bold',
        fontSize: 18,
        backgroundColor: '#d6d6d6',
        width: 125,
        padding: 5,
        borderRadius: 10,
        marginBottom: 10,
    },
    mealHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        marginLeft: 10,
    },
    mealItem: {
        borderBottomWidth: 0.25,
        borderBottomColor: '#bdbdbd',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginLeft: 20,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    mealName: {
        fontSize: 16,
    },
    portionSelector: {
        width: 40,
        height: 30,
        backgroundColor: '#d6d6d6',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionText: {
        fontWeight: 'bold',
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 150,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    modalText: {
        fontSize: 18,
        padding: 10,
        textAlign: 'center',
    },
    modalCancel: {
        marginTop: 10,
        fontSize: 16,
        color: '#ff3333',
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        paddingBottom: 5,
    },
    mainButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
        alignItems: 'center',
        width: '95%',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
