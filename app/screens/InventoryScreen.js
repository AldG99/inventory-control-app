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
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import colors from '../constants/colors';

// Dimensiones y utilidades responsive
const { width, height } = Dimensions.get('window');

const wp = percentage => {
  const value = (percentage * width) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

const hp = percentage => {
  const value = (percentage * height) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

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

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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
            {formatCurrency(item.price || 0)}
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
          <Ionicons name="create-outline" size={wp(4.5)} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={wp(4.5)} color={colors.white} />
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
            <Ionicons name="search" size={wp(5)} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={wp(5)}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Ionicons name="add" size={wp(6)} color={colors.white} />
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
            <Ionicons
              name="cube-outline"
              size={wp(15)}
              color={colors.textMuted}
            />
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
    padding: wp(4),
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    height: hp(6),
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(4),
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(1) },
    shadowOpacity: 0.3,
    shadowRadius: wp(2),
  },
  categoriesContainer: {
    marginBottom: hp(2),
  },
  categoriesScroll: {
    paddingVertical: hp(0.5),
  },
  categoryChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(5),
    backgroundColor: colors.white,
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: wp(3.5),
    color: colors.text,
  },
  selectedCategoryText: {
    color: colors.white,
    fontWeight: '500',
  },
  productsList: {
    paddingBottom: hp(2),
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(1),
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  productSku: {
    fontSize: wp(3.2),
    color: colors.textLight,
    marginBottom: hp(0.8),
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  productPrice: {
    fontSize: wp(3.8),
    fontWeight: '600',
    color: colors.text,
    marginRight: wp(2.5),
  },
  stockBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: wp(1),
  },
  inStockBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  stockText: {
    fontSize: wp(3),
    fontWeight: '500',
  },
  productQuantity: {
    fontSize: wp(3.2),
    color: colors.textLight,
  },
  productActions: {
    justifyContent: 'space-between',
    paddingLeft: wp(2.5),
  },
  actionButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(0.8),
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
    marginTop: hp(1.5),
    fontSize: wp(4),
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyStateTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptyStateText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: hp(3),
  },
  addProductButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: wp(2.5),
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
  },
  addProductButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: wp(4),
  },
});

export default InventoryScreen;
