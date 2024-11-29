import React, { useEffect, useRef, forwardRef, useState, useLayoutEffect, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { InteractionManager } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { globalStyles } from '../globalStyles';
import ImageBackgroundWrapper from '../components/ImageBackgroundWrapper'; // Import du wrapper

const calendrier = {
    janvier: {
        legumes: ["Ail", "Betterave", "Carotte", "Céleri", "Chou", "Courge", "Endive", "Épinard", "Frisée", "Mâche", "Navet", "Panais", "Poireau", "Topinambour"],
        fruits: ["Amande sèche", "Citron", "Clémentine", "Kaki", "Kiwi", "Mandarine", "Orange", "Pamplemousse", "Physalis", "Poire", "Pomme"],
        cereales_legumineuses: ["Lentille"]
    },
    février: {
        legumes: ["Ail", "Betterave", "Carotte", "Céleri-rave", "Chou", "Endive", "Épinard", "Frisée", "Mâche", "Navet", "Panais", "Poireau", "Radis", "Salsifi", "Topinambour"],
        fruits: ["Amande sèche", "Citron", "Clémentine", "Kiwi", "Mandarine", "Orange", "Pamplemousse", "Physalis", "Poire", "Pomme"],
        cereales_legumineuses: ["Lentille"]
    },
    mars: {
        legumes: ["Ail", "Asperge", "Betterave", "Blette", "Carotte", "Céleri-rave", "Chou", "Crosne", "Endive", "Épinard", "Frisée", "Navet", "Panais", "Poireau", "Radis", "Salsifi", "Topinambour"],
        fruits: ["Amande sèche", "Citron", "Kiwi", "Orange", "Pamplemousse", "Poire", "Pomme"],
        cereales_legumineuses: ["Lentille"]
    },
    avril: {
        legumes: ["Ail", "Artichaut", "Asperge", "Betterave", "Blette", "Carotte", "Chou-fleur", "Concombre", "Endive", "Épinard", "Frisée", "Laitue", "Navet", "Oignon", "Petit pois", "Poireau", "Radis"],
        fruits: ["Amande sèche", "Citron", "Pamplemousse", "Poire", "Pomme"],
        cereales_legumineuses: []
    },
    mai: {
        legumes: ["Ail", "Artichaut", "Asperge", "Aubergine", "Betterave", "Blette", "Carotte", "Chou-fleur", "Concombre", "Courgette", "Épinard", "Laitue", "Navet", "Oignon", "Petit pois", "Radis"],
        fruits: ["Amande sèche", "Cerise", "Fraise", "Pamplemousse", "Rhubarbe", "Tomate"],
        cereales_legumineuses: []
    },
    juin: {
        legumes: ["Ail", "Artichaut", "Asperge", "Aubergine", "Blette", "Brocoli", "Carotte", "Chou romanesco", "Concombre", "Courgette", "Épinard", "Fenouil", "Haricot vert", "Laitue", "Navet", "Petit pois", "Poivron", "Radis"],
        fruits: ["Abricot", "Amande sèche", "Brugnon", "Cassis", "Cerise", "Citron", "Fraise", "Framboise", "Groseille", "Melon", "Pamplemousse", "Pastèque", "Pêche", "Pomme", "Prune", "Rhubarbe", "Tomate"],
        cereales_legumineuses: ["Avoine", "Orge d'hiver", "Pois", "Seigle"]
    },
    juillet: {
        legumes: ["Ail", "Artichaut", "Asperge", "Aubergine", "Betterave", "Blette", "Brocoli", "Carotte", "Céleri-branche", "Concombre", "Courgette", "Épinard", "Fenouil", "Haricot vert", "Laitue", "Petit pois", "Poivron", "Radis"],
        fruits: ["Abricot", "Amande fraiche", "Amande sèche", "Brugnon", "Cassis", "Cerise", "Figue", "Fraise", "Framboise", "Groseille", "Melon", "Myrtille", "Nectarine", "Pastèque", "Pêche", "Poire", "Prune", "Rhubarbe", "Tomate"],
        cereales_legumineuses: ["Avoine", "Blé dur", "Blé tendre", "Féveroles et fèves", "Haricot blanc", "Maïs", "Orge", "Pois", "Seigle"]
    },
    août: {
        legumes: ["Ail", "Artichaut", "Aubergine", "Betterave", "Blette", "Brocoli", "Carotte", "Céleri-branche", "Chou", "Courge", "Courgette", "Épinard", "Fenouil", "Frisée", "Haricot vert", "Laitue", "Poivron", "Radis"],
        fruits: ["Abricot", "Amande fraiche", "Amande sèche", "Baie de goji", "Brugnon", "Cassis", "Figue", "Fraise", "Framboise", "Groseille", "Melon", "Mirabelle", "Mûre", "Myrtille", "Nectarine", "Noisette", "Pastèque", "Pêche", "Poire", "Pomme", "Prune", "Pruneau", "Raisin", "Tomate"],
        cereales_legumineuses: ["Avoine", "Blé dur", "Blé tendre", "Féveroles et fèves", "Haricot blanc", "Maïs", "Orge", "Quinoa", "Seigle"]
    },
    septembre: {
        legumes: ["Ail", "Artichaut", "Aubergine", "Betterave", "Blette", "Brocoli", "Carotte", "Céleri-branche", "Chou", "Concombre", "Courge", "Courgette", "Épinard", "Fenouil", "Frisée", "Haricot vert", "Laitue", "Panais", "Patate douce", "Poireau", "Poivron", "Potiron", "Radis"],
        fruits: ["Amande sèche", "Baie de goji", "Coing", "Figue", "Melon", "Mirabelle", "Mûre", "Myrtille", "Noisette", "Noix", "Pastèque", "Pêche", "Poire", "Pomme", "Prune", "Pruneau", "Raisin", "Tomate"],
        cereales_legumineuses: ["Haricot blanc", "Maïs", "Quinoa", "Riz", "Sarrasin", "Tournesol"]
    },
    octobre: {
        legumes: ["Ail", "Aubergine", "Betterave", "Blette", "Brocoli", "Carotte", "Céleri", "Chou", "Concombre", "Courge", "Courgette", "Échalote", "Endive", "Épinard", "Fenouil", "Frisée", "Haricot vert", "Laitue", "Navet", "Panais", "Patate douce", "Poireau", "Radis", "Rutabaga", "Salsifi", "Topinambour"],
        fruits: ["Amande sèche", "Baie de goji", "Châtaigne", "Citron", "Coing", "Figue", "Framboise", "Kaki", "Myrtille", "Noisette", "Noix", "Physalis", "Poire", "Pomme", "Raisin", "Tomate"],
        cereales_legumineuses: ["Haricot blanc", "Maïs", "Quinoa", "Riz", "Sarrasin", "Soja"]
    },
    novembre: {
        legumes: ["Ail", "Betterave", "Brocoli", "Cardon", "Carotte", "Céleri", "Chou", "Courge", "Crosne", "Échalote", "Endive", "Épinard", "Fenouil", "Frisée", "Mâche", "Navet", "Panais", "Poireau", "Radis", "Rutabaga", "Salsifi", "Topinambour"],
        fruits: ["Amande sèche", "Châtaigne", "Citron", "Clémentine", "Coing", "Kaki", "Kiwi", "Mandarine", "Orange", "Physalis", "Poire", "Pomme"],
        cereales_legumineuses: ["Lentille", "Maïs"]
    },
    décembre: {
        legumes: ["Ail", "Betterave", "Carotte", "Céleri", "Chou", "Courge", "Crosne", "Échalote", "Endive", "Épinard", "Frisée", "Mâche", "Navet", "Panais", "Poireau", "Radis", "Rutabaga", "Salsifi", "Topinambour"],
        fruits: ["Amande sèche", "Châtaigne", "Citron", "Clémentine", "Kaki", "Kiwi", "Mandarine", "Orange", "Physalis", "Poire", "Pomme"],
        cereales_legumineuses: ["Avoine", "Blé dur", "Blé tendre", "Féveroles et fèves", "Lentille", "Orge", "Pois", "Seigle"]
    }
}

const monthSeasons = {
    janvier: 'hiver',
    février: 'hiver',
    mars: 'printemps',
    avril: 'printemps',
    mai: 'printemps',
    juin: 'été',
    juillet: 'été',
    août: 'été',
    septembre: 'automne',
    octobre: 'automne',
    novembre: 'automne',
    décembre: 'hiver',
};

// Définir des couleurs pour chaque saison
const seasonColors = {
printemps: '#E6F3CE', // Exemple de couleur pour le printemps
été: '#FFDFBA', // Exemple de couleur pour l'été
automne: '#FFFFBA', // Exemple de couleur pour l'automne
hiver: '#BAE1FF', // Exemple de couleur pour l'hiver
default: '#ccc', // Couleur grise pour les saisons non sélectionnées
};

// Création d'un composant FlatList personnalisé qui accepte une référence
const CustomFlatList = forwardRef((props, ref) => {
    return <FlatList ref={ref} {...props} />;
});

export default function SeasonalCalendarScreen({ navigation }) {
    const [favoris, setFavoris] = useState({});
    const [showOnlyFavoris, setShowOnlyFavoris] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    // Utilisation de useAsyncStorage pour gérer les favoris
    const [favorisData, setFavorisData] = useAsyncStorage('favoris', []);

    // Chargement initial des favoris
    useEffect(() => {
        // Chargement initial des favoris depuis AsyncStorage
        if (favorisData) {
            setFavoris(favorisData); // Pas besoin de JSON.parse ici, favorisData est déjà un objet JSON
        }
    }, [favorisData]);
    
    useEffect(() => {
        const saveFavoris = () => {
            try {
                console.log('Favoris avant sauvegarde :', favoris);
                setFavoris(favoris); // Sauvegarde directe avec setFavoris
                console.log('Favoris sauvegardés avec succès :', favoris);
            } catch (error) {
                console.error('Erreur lors de la sauvegarde des favoris :', error);
            }
        };
        saveFavoris();
    }, [favoris]);

    // Sauvegarder les favoris dans AsyncStorage à chaque changement
    useEffect(() => {
        const saveFavoris = async () => {
            try {
                await setFavorisData(favoris);
                console.log('Favoris sauvegardés :', favoris);
            } catch (error) {
                console.error('Erreur lors de la sauvegarde des favoris :', error);
            }
        };

        // Sauvegarde les favoris seulement quand il y a un changement
        if (favoris) {
            saveFavoris();
        }
    }, [favoris, setFavorisData]);
    

    // Paramétrage de l'en-tête avec le bouton retour et le bouton favoris avec "i"
    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitleVisible: false, // pour afficher la flèche de retour par défaut
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Icon name="arrow-left" size={25} color="#000" marginLeft={15} />
                </TouchableOpacity>
              ),
              headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setMenuVisible(prev => !prev)} style={styles.menuButton}>
                        <Icon name="menu" size={30} color="#000" marginRight={20}/>
                    </TouchableOpacity>
    
                    {menuVisible && (
                        <View style={styles.menu}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => setShowOnlyFavoris(true)}>
                                <Text>Afficher les favoris</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => setShowOnlyFavoris(false)}>
                                <Text>Masquer les favoris</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => handleResetFavoris()}>
                                <Text>Réinitialiser les favoris</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ),
        });
    }, [navigation, showOnlyFavoris, menuVisible]);

    const months = Object.keys(calendrier);
    const currentMonth = new Date().toLocaleString('default', { month: 'long' }).toLowerCase();
    const currentMonthIndex = months.indexOf(currentMonth);
    const flatListRef = useRef(null); // Créez une référence pour le FlatList
    const itemWidth = 430; // Largeur du mois
    const itemMargin = 10; // Marge horizontale

    // Toggle le favori pour l'item donné dans la catégorie spécifiée
    const toggleFavoris = (category, item) => {
        setFavoris(prevFavoris => {
            const categoryFavoris = prevFavoris[category] || [];
            const isFavoriItem = categoryFavoris.includes(item);

            // Ajoute ou retire l'élément de la liste des favoris
            return {
                ...prevFavoris,
                [category]: isFavoriItem 
                    ? categoryFavoris.filter(favItem => favItem !== item)
                    : [...categoryFavoris, item]
            };
        });
    };
    
    const isFavori = (category, item) => {
        return favoris[category]?.includes(item);
    };

    // Ajout de la fonction pour gérer les favoris globalement
    const handleToggleFavoris = (item) => {
        setFavoris((prevFavoris) => {
            const updatedFavoris = { ...prevFavoris };
            let itemIsFavori = false;
    
            // Parcours chaque mois pour voir si l'élément est favori dans une des catégories
            months.forEach((month) => {
                const categories = ["legumes", "fruits", "cereales_legumineuses"];
                categories.forEach((category) => {
                    if (calendrier[month][category].includes(item)) {
                        const categoryFavoris = updatedFavoris[category] || [];
                        if (categoryFavoris.includes(item)) {
                            itemIsFavori = true;
                        }
                    }
                });
            });
    
            // Si l'élément est déjà favori, on le retire de chaque catégorie
            if (itemIsFavori) {
                months.forEach((month) => {
                    const categories = ["legumes", "fruits", "cereales_legumineuses"];
                    categories.forEach((category) => {
                        if (calendrier[month][category].includes(item)) {
                            updatedFavoris[category] = (updatedFavoris[category] || []).filter(favItem => favItem !== item);
                        }
                    });
                });
            } 
            // Sinon, on l'ajoute à chaque catégorie où il est présent
            else {
                months.forEach((month) => {
                    const categories = ["legumes", "fruits", "cereales_legumineuses"];
                    categories.forEach((category) => {
                        if (calendrier[month][category].includes(item)) {
                            updatedFavoris[category] = [...(updatedFavoris[category] || []), item];
                        }
                    });
                });
            }
    
            return updatedFavoris;
        });
    };
    

    const handleResetFavoris = () => {
        setFavoris({});
        setShowOnlyFavoris(false);
        setMenuVisible(false);
    };

    const renderItems = (items, month, category) => {
        return items
          .filter(item => !showOnlyFavoris || isFavori(category, item))
          .map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.itemButton, { borderColor: isFavori(category, item) ? 'red' : '#ccc' }]}
              onPress={() => toggleFavoris(category, item)}
            >
                <Text 
                  style={[styles.itemText, isFavori(category, item) && styles.favoriText]}
                >
                {item} {isFavori(category, item) ? '❤️ ' : ''}
                </Text>
            </TouchableOpacity>
          ));
    };
    

    const renderMonth = ({ item }) => {
        const season = monthSeasons[item]; // Obtenir la saison pour le mois
        const backgroundColor = seasonColors[season] || seasonColors.default; // Couleur de fond
        const textColor = darkenColor(seasonColors[season]); // Appel à une fonction pour assombrir la couleur
        const { legumes, fruits, cereales_legumineuses } = calendrier[item];

        return (
            <View style={[styles.monthContainer, { backgroundColor }]}>

                <Text style={[styles.monthTitle, globalStyles.textMonth
                    , { color: textColor }]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
                <View style={styles.categoryContainer}>
                    <Text style={[styles.categoryTitle, globalStyles.textTitleDeux]}>Fruits:</Text>
                    <View style={styles.itemGrid}>{renderItems(fruits, item, 'fruits')}</View>
                </View>
                <View style={styles.categoryContainer}>
                    <Text style={[styles.categoryTitle, globalStyles.textTitleDeux]}>Légumes:</Text>
                    <View style={styles.itemGrid}>{renderItems(legumes, item, 'legumes')}</View>
                </View>
                {/* <View style={styles.categoryContainer}>
                    <Text style={[styles.categoryTitle, globalStyles.textTitleDeux]}>Céréales et Légumineuses:</Text>
                    <View style={styles.itemGrid}>{renderItems(cereales_legumineuses, item, 'cereales_legumineuses')}</View>
                </View> */}
            </View>
        );
    };

    const getItemLayout = (data, index) => ({
        length: itemWidth + itemMargin * 2, // Hauteur fixe de chaque élément avec marges
        offset: (itemWidth + itemMargin * 2) * index,
        index,
    });

    const darkenColor = (color) => {
        const colorObj = hexToRgb(color);
        // console.log(colorObj)
        const darkenedColor = {
            r: Math.max(0, colorObj.r - 300),
            g: Math.max(0, colorObj.g - 300),
            b: Math.max(0, colorObj.b - 300),
        };
        return rgbToHex(darkenedColor.r, darkenedColor.g, darkenedColor.b);
    };

    // Fonction pour convertir une couleur hexadécimale en RGB
    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        return { r, g, b };
    };

    // Fonction pour convertir RGB en couleur hexadécimale
    const rgbToHex = (r, g, b) => {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    };

    useEffect(() => {
        const totalWidth = (itemWidth + itemMargin * 2) * months.length; // Largeur totale de la liste
        const centerOffset = totalWidth / 2 - itemWidth / 2; // Offset pour centrer le mois

        const scrollToCurrentMonth = () => {
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                    index: currentMonthIndex,
                    animated: true,
                    viewPosition: 0.5, // Centrer l'élément
                    // Ajuster l'offset en fonction de la position du mois
                    offset: currentMonthIndex === 0 ? -centerOffset : (currentMonthIndex === months.length - 1 ? centerOffset : 0),
                });
            }
        };

        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            // Démarrer le scroll après que toutes les interactions soient terminées
            const timer = setTimeout(scrollToCurrentMonth, 0); // Peut être ajusté si nécessaire
    
            return () => clearTimeout(timer); // Nettoyer le timer après l'animation
        });
    
        // Nettoyer l'interaction au démontage
        return () => interactionPromise.cancel();

    }, [currentMonthIndex]);

    return (
        <ImageBackgroundWrapper imageOpacity={0.6}>
            <View style={styles.container}>
                <CustomFlatList // Utilisation du composant FlatList personnalisé
                    ref={flatListRef} // Ajout de la référence
                    data={months}
                    renderItem={renderMonth}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    getItemLayout={getItemLayout}
                    contentContainerStyle={styles.flatList}
                    style={styles.flatListStyle} // Ajout du style ici
                />
            </View>
        </ImageBackgroundWrapper>
    );
    }

const styles = StyleSheet.create({
    menu: {
        flexDirection: 'column',
        alignItems: 'flex-start', // Alignement à gauche pour une meilleure lisibilité
        backgroundColor: '#fff', // Fond blanc
        borderWidth: 1,
        borderColor: '#ccc', // Bordure grise
        borderRadius: 5,
        padding: 5,
        position: 'absolute', // Positionner le menu au-dessus des autres éléments
        top: 40, // Ajustez en fonction de l'espacement souhaité
        right: 10, // Ajustez selon la position désirée
        elevation: 5, // Ombre pour un effet de profondeur sur Android
        zIndex: 1, // Assure que le menu soit au-dessus d'autres éléments
    },
    
    menuItem: {
        paddingVertical: 10, // Espacement vertical pour chaque élément
        paddingHorizontal: 15, // Espacement horizontal
        width: '100%', // Prendre toute la largeur du menu
    },
    container: {
        flex: 1,
        // backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 0,
        },
    favorisButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 10,
        },
        favorisButtonText: {
        fontSize: 14,
        },
    flatList: {
        //   paddingVertical: 30,
        paddingTop: 20,
        paddingBottom: 30,
        },
    flatListStyle: {
        marginHorizontal: 10, // Marge à gauche et à droite
        },
    monthContainer: {
        marginVertical: 30,
        marginHorizontal: 10,
        padding: 15,
        borderRadius: 10,
        //   backgroundColor: '#f0f0f0',
        width: 430, // Ajustez la largeur selon vos besoins
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5, // Pour Android
        },
    monthTitle: {
    //   fontFamily: 'POLYA',
      fontSize: 60,
    //   fontWeight: 'bold', // ne fonctionne pas avec la custom font
      marginBottom: 15,
      textAlign: 'center',
    },
    categoryContainer: {
      marginBottom: 5,
    },
    categoryTitle: {
      fontSize: 18,
    //   fontFamily: 'rubik_moonrocks',
    //   fontWeight: 'bold',
      marginBottom: 10,
    },
    categoryText: {
      fontSize: 16,
      color: '#555',
    },
    itemGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        marginBottom: 20,
    },
    itemButton: {
        borderWidth: 0.5,
        // backgroundColor: '#e0e0e0', // Couleur de fond pour les boutons
        // padding: 5,
        paddingHorizontal: 5,
        paddingVertical : 3,
        margin: 2.5,
        borderRadius: 10,
        flexBasis: '30%', // Ajuste la largeur selon tes besoins
        alignItems: 'center',
    },
    favoriText: {
        // fontStyle: 'italic',
        color: 'red',
      },
    itemText: {
        fontSize: 15,
    },
    infoButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 50,
    },
    infoButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
  });
