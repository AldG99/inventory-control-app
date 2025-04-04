import React, { useContext, useState, useEffect } from 'react';
import {
 StyleSheet,
 View,
 Text,
 TouchableOpacity,
 FlatList,
 TextInput,
 ActivityIndicator,
 RefreshControl,
 Alert,
 ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import colors from '../constants/colors';

const InventoryScreen = ({ navigation }) => {
 const { products, loading, deleteProduct } = useContext(InventoryContext);
 const [refreshing, setRefreshing] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [filteredProducts, setFilteredProducts] = useState([]);
 const [selectedCategory, setSelectedCategory] = useState('Todos');

 // Extraer categorías únicas de los productos
 const categories = [
 'Todos',
 ...new Set(products.map(p => p.category).filter(Boolean)),
 ];

 // Filtrar productos según búsqueda y categoría seleccionada
 useEffect(() => {
 let result = [...products];

 // Filtrar por categoría si no es "Todos"
 if (selectedCategory !== 'Todos') {
 result = result.filter(product => product.category === selectedCategory);
 }

 // Filtrar por término de búsqueda
 if (searchQuery) {
 const query = searchQuery.toLowerCase();
 result = result.filter(
 product =>
 product.name?.toLowerCase().includes(query) ||
 product.sku?.toLowerCase().includes(query) ||
 product.description?.toLowerCase().includes(query)
 );
 }

 // Ordenar por nombre
 result.sort((a, b) => a.name?.localeCompare(b.name));

 setFilteredProducts(result);
 }, [products, searchQuery, selectedCategory]);

 // Función para refrescar datos
 const onRefresh = async () => {
 setRefreshing(true);
 // Los productos se recargan automáticamente por el context
 setTimeout(() => setRefreshing(false), 1000);
 };

 // Función para eliminar un producto
 const handleDeleteProduct = (productId, productName) => {
 Alert.alert(
 'Eliminar Producto',
 `¿Estás seguro de eliminar "${productName}"?`,
 [
 { text: 'Cancelar', style: 'cancel' },
 {
 text: 'Eliminar',
 style: 'destructive',
 onPress: async () => {
 try {
 await deleteProduct(productId);
 Alert.alert('Éxito', 'Producto eliminado correctamente');
 } catch (error) {
 Alert.alert('Error', 'No se pudo eliminar el producto');
 }
 },
 },
 ]
 );
 };

 // Renderizar cada elemento de la lista de productos
 const renderProductItem = ({ item }) => (
 <TouchableOpacity
 style={styles.productCard}
 onPress={() =>
 navigation.navigate('ProductDetail', { productId: item.id })
 }
 >
 <View style={styles.productInfo}>
 <Text style={styles.productName}>{item.name}</Text>
 {item.sku && <Text style={styles.productSku}>SKU: {item.sku}</Text>}
 <View style={styles.productDetails}>
 <Text style={styles.productPrice}>
 {new Intl.NumberFormat('es-ES', {
 style: 'currency',
 currency: 'EUR',
 }).format(item.price || 0)}
 </Text>
 <View
 style={[
 styles.stockBadge,
 item.quantity <= 0
 ? styles.outOfStockBadge
 : item.quantity <= 5
 ? styles.lowStockBadge
 : styles.inStockBadge,
 ]}
 >
 <Text style={styles.stockText}>
 {item.quantity <= 0
 ? 'Agotado'
 : item.quantity <= 5
 ? 'Stock Bajo'
 : 'En Stock'}
 </Text>
 </View>
 </View>
 <Text style={styles.productQuantity}>
 Cantidad: {item.quantity || 0} unidades
 </Text>
 </View>
 <View style={styles.productActions}>
 <TouchableOpacity
 style={[styles.actionButton, styles.editButton]}
 onPress={() =>
 navigation.navigate('ProductDetail', { productId: item.id })
 }
 >
 <Ionicons name="create-outline" size={18} color={colors.white} />
 </TouchableOpacity>
 <TouchableOpacity
 style={[styles.actionButton, styles.deleteButton]}
 onPress={() => handleDeleteProduct(item.id, item.name)}
 >
 <Ionicons name="trash-outline" size={18} color={colors.white} />
 </TouchableOpacity>
 </View>
 </TouchableOpacity>
 );

 return (
 <SafeAreaView style={styles.safeArea}>
 <View style={styles.container}>
 {/* Barra de búsqueda */}
 <View style={styles.searchContainer}>
 <View style={styles.searchBar}>
 <Ionicons name="search" size={20} color={colors.textLight} />
 <TextInput
 style={styles.searchInput}
 placeholder="Buscar productos..."
 value={searchQuery}
 onChangeText={setSearchQuery}
 />
 {searchQuery ? (
 <TouchableOpacity onPress={() => setSearchQuery('')}>
 <Ionicons
 name="close-circle"
 size={20}
 color={colors.textLight}
 />
 </TouchableOpacity>
 ) : null}
 </View>
 <TouchableOpacity
 style={styles.addButton}
 onPress={() => navigation.navigate('AddProduct')}
 >
 <Ionicons name="add" size={24} color={colors.white} />
 </TouchableOpacity>
 </View>

 {/* Filtro por categorías */}
 <View style={styles.categoriesContainer}>
 <ScrollView
 horizontal
 showsHorizontalScrollIndicator={false}
 contentContainerStyle={styles.categoriesScroll}
 >
 {categories.map(category => (
 <TouchableOpacity
 key={category}
 style={[
 styles.categoryChip,
 selectedCategory === category && styles.selectedCategoryChip,
 ]}
 onPress={() => setSelectedCategory(category)}
 >
 <Text
 style={[
 styles.categoryText,
 selectedCategory === category &&
 styles.selectedCategoryText,
 ]}
 >
 {category}
 </Text>
 </TouchableOpacity>
 ))}
 </ScrollView>
 </View>

 {/* Lista de productos */}
 {loading ? (
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color={colors.primary} />
 <Text style={styles.loadingText}>Cargando productos...</Text>
 </View>
 ) : filteredProducts.length > 0 ? (
 <FlatList
 data={filteredProducts}
 renderItem={renderProductItem}
 keyExtractor={item => item.id}
 contentContainerStyle={styles.productsList}
 refreshControl={
 <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 }
 />
 ) : (
 <View style={styles.emptyState}>
 <Ionicons name="cube-outline" size={60} color={colors.gray} />
 <Text style={styles.emptyStateTitle}>No hay productos</Text>
 <Text style={styles.emptyStateText}>
 {searchQuery
 ? `No se encontraron productos que coincidan con "${searchQuery}"`
 : selectedCategory !== 'Todos'
 ? `No hay productos en la categoría "${selectedCategory}"`
 : 'Comienza añadiendo tu primer producto'}
 </Text>
 <TouchableOpacity
 style={styles.addProductButton}
 onPress={() => navigation.navigate('AddProduct')}
 >
 <Text style={styles.addProductButtonText}>Añadir Producto</Text>
 </TouchableOpacity>
 </View>
 )}
 </View>
 </SafeAreaView>
 );
};

const styles = StyleSheet.create({
 safeArea: {
 flex: 1,
 backgroundColor: colors.background,
 },
 container: {
 flex: 1,
 padding: 16,
 },
 searchContainer: {
 flexDirection: 'row',
 marginBottom: 16,
 },
 searchBar: {
 flex: 1,
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: colors.white,
 borderRadius: 8,
 paddingHorizontal: 12,
 height: 44,
 marginRight: 12,
 borderWidth: 1,
 borderColor: colors.border,
 },
 searchInput: {
 flex: 1,
 marginLeft: 8,
 fontSize: 16,
 color: colors.text,
 },
 addButton: {
 backgroundColor: colors.primary,
 width: 44,
 height: 44,
 borderRadius: 8,
 justifyContent: 'center',
 alignItems: 'center',
 },
 categoriesContainer: {
 marginBottom: 16,
 },
 categoriesScroll: {
 paddingVertical: 8,
 },
 categoryChip: {
 paddingHorizontal: 16,
 paddingVertical: 6,
 borderRadius: 20,
 backgroundColor: colors.white,
 marginRight: 8,
 borderWidth: 1,
 borderColor: colors.border,
 },
 selectedCategoryChip: {
 backgroundColor: colors.primary,
 borderColor: colors.primary,
 },
 categoryText: {
 fontSize: 14,
 color: colors.text,
 },
 selectedCategoryText: {
 color: colors.white,
 fontWeight: '500',
 },
 productsList: {
 paddingBottom: 20,
 },
 productCard: {
 flexDirection: 'row',
 backgroundColor: colors.white,
 borderRadius: 8,
 padding: 12,
 marginBottom: 10,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 1 },
 shadowOpacity: 0.1,
 shadowRadius: 2,
 elevation: 2,
 },
 productInfo: {
 flex: 1,
 },
 productName: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 4,
 },
 productSku: {
 fontSize: 13,
 color: colors.textLight,
 marginBottom: 6,
 },
 productDetails: {
 flexDirection: 'row',
 alignItems: 'center',
 marginBottom: 4,
 },
 productPrice: {
 fontSize: 15,
 fontWeight: '600',
 color: colors.text,
 marginRight: 10,
 },
 stockBadge: {
 paddingHorizontal: 8,
 paddingVertical: 2,
 borderRadius: 4,
 },
 inStockBadge: {
 backgroundColor: '#E8F5E9',
 },
 lowStockBadge: {
 backgroundColor: '#FFF8E1',
 },
 outOfStockBadge: {
 backgroundColor: '#FFEBEE',
 },
 stockText: {
 fontSize: 12,
 fontWeight: '500',
 },
 productQuantity: {
 fontSize: 13,
 color: colors.textLight,
 },
 productActions: {
 justifyContent: 'space-between',
 paddingLeft: 10,
 },
 actionButton: {
 width: 36,
 height: 36,
 borderRadius: 18,
 justifyContent: 'center',
 alignItems: 'center',
 marginBottom: 6,
 },
 editButton: {
 backgroundColor: colors.primary,
 },
 deleteButton: {
 backgroundColor: colors.danger,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 },
 loadingText: {
 marginTop: 10,
 fontSize: 16,
 color: colors.textLight,
 },
 emptyState: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 paddingHorizontal: 32,
 },
 emptyStateTitle: {
 fontSize: 20,
 fontWeight: 'bold',
 color: colors.text,
 marginTop: 16,
 marginBottom: 8,
 },
 emptyStateText: {
 fontSize: 16,
 color: colors.textLight,
 textAlign: 'center',
 marginBottom: 24,
 },
 addProductButton: {
 backgroundColor: colors.primary,
 paddingVertical: 12,
 paddingHorizontal: 20,
 borderRadius: 8,
 },
 addProductButtonText: {
 color: colors.white,
 fontWeight: 'bold',
 fontSize: 16,
 },
});

export default InventoryScreen;
