import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Importar utilidades responsive
import {
  wp,
  hp,
  isTablet,
  dimensions,
  SCREEN_WIDTH,
} from '../utils/responsive';
import colors from '../constants/colors';

// Habilitar animaciones de diseño en Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProductListComponent = ({
  products = [],
  loading = false,
  onRefresh,
  onSelect,
  showCategories = true,
}) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isTableView, setIsTableView] = useState(isTablet());

  // Extraer categorías únicas de los productos
  const categories = [
    'Todos',
    ...new Set(products.map(p => p.category).filter(Boolean)),
  ];

  // Filtrar y ordenar productos
  useEffect(() => {
    // Animar el cambio de layout
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

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

    // Ordenar productos
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Manejar valores nulos o indefinidos
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        // Ordenar según el tipo de dato
        if (typeof a[sortConfig.key] === 'string') {
          return sortConfig.direction === 'asc'
            ? a[sortConfig.key].localeCompare(b[sortConfig.key])
            : b[sortConfig.key].localeCompare(a[sortConfig.key]);
        } else {
          return sortConfig.direction === 'asc'
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
      });
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, sortConfig]);

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cambiar ordenamiento
  const handleSort = key => {
    setSortConfig(prevSortConfig => ({
      key,
      direction:
        prevSortConfig.key === key
          ? prevSortConfig.direction === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    }));
  };

  // Renderizar icono de ordenamiento
  const renderSortIcon = key => {
    if (sortConfig.key !== key) {
      return (
        <Ionicons
          name="swap-vertical-outline"
          size={wp(4)}
          color={colors.textMuted}
        />
      );
    }
    return (
      <Ionicons
        name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
        size={wp(4)}
        color={colors.primary}
      />
    );
  };

  // Renderizar vista de tarjeta
  const renderCardItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        onSelect
          ? onSelect(item)
          : navigation.navigate('ProductDetail', { productId: item.id })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <View
          style={[
            styles.stockIndicator,
            item.quantity <= 0
              ? styles.outOfStockIndicator
              : item.quantity <= 5
              ? styles.lowStockIndicator
              : styles.inStockIndicator,
          ]}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>SKU:</Text>
          <Text style={styles.cardValue}>{item.sku || 'N/A'}</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Precio:</Text>
          <Text style={styles.cardValue}>
            {formatCurrency(item.price || 0)}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Stock:</Text>
          <Text style={styles.cardValue}>{item.quantity || 0} uds.</Text>
        </View>

        {item.category && (
          <View style={styles.cardCategory}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('ProductDetail', { productId: item.id })
          }
        >
          <Ionicons name="eye-outline" size={wp(5)} color={colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Renderizar cabecera de tabla
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <TouchableOpacity
        style={styles.tableHeaderProduct}
        onPress={() => handleSort('name')}
      >
        <Text style={styles.tableHeaderText}>Producto</Text>
        {renderSortIcon('name')}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tableHeaderPrice}
        onPress={() => handleSort('price')}
      >
        <Text style={styles.tableHeaderText}>Precio</Text>
        {renderSortIcon('price')}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tableHeaderStock}
        onPress={() => handleSort('quantity')}
      >
        <Text style={styles.tableHeaderText}>Stock</Text>
        {renderSortIcon('quantity')}
      </TouchableOpacity>

      <View style={styles.tableHeaderActions}>
        <Text style={styles.tableHeaderText}>Acciones</Text>
      </View>
    </View>
  );

  // Renderizar fila de tabla
  const renderTableRow = ({ item }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() =>
        onSelect
          ? onSelect(item)
          : navigation.navigate('ProductDetail', { productId: item.id })
      }
    >
      <View style={styles.tableRowProduct}>
        <Text style={styles.productNameTable} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productSku}>{item.sku || 'Sin SKU'}</Text>
      </View>

      <View style={styles.tableRowPrice}>
        <Text style={styles.priceText}>{formatCurrency(item.price || 0)}</Text>
      </View>

      <View style={styles.tableRowStock}>
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
          <Text
            style={[
              styles.stockText,
              item.quantity <= 0
                ? styles.outOfStockText
                : item.quantity <= 5
                ? styles.lowStockText
                : styles.inStockText,
            ]}
          >
            {item.quantity || 0} uds.
          </Text>
        </View>
      </View>

      <View style={styles.tableRowActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() =>
            navigation.navigate('ProductDetail', { productId: item.id })
          }
        >
          <Ionicons name="eye-outline" size={wp(4.5)} color={colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Renderizar barra de búsqueda
  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        isSearchFocused && styles.searchContainerFocused,
      ]}
    >
      <Ionicons
        name="search"
        size={wp(5)}
        color={isSearchFocused ? colors.primary : colors.textLight}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar productos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
      />
      {searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={wp(5)} color={colors.textLight} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // Renderizar selector de categorías
  const renderCategorySelector = () =>
    showCategories ? (
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item, index) => `category-${index}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.selectedCategoryChip,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.selectedCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
    ) : null;

  // Renderizar selector de vista
  const renderViewSelector = () => (
    <View style={styles.viewSelectorContainer}>
      <TouchableOpacity
        style={[styles.viewSelector, !isTableView && styles.viewSelectorActive]}
        onPress={() => setIsTableView(false)}
      >
        <Ionicons
          name="grid-outline"
          size={wp(5)}
          color={!isTableView ? colors.primary : colors.textLight}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewSelector, isTableView && styles.viewSelectorActive]}
        onPress={() => setIsTableView(true)}
      >
        <Ionicons
          name="list-outline"
          size={wp(5)}
          color={isTableView ? colors.primary : colors.textLight}
        />
      </TouchableOpacity>
    </View>
  );

  // Estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={wp(15)} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No hay productos</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No se encontraron productos que coincidan con "${searchQuery}"`
          : selectedCategory !== 'Todos'
          ? `No hay productos en la categoría "${selectedCategory}"`
          : 'No hay productos disponibles'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {renderSearchBar()}
        {renderViewSelector()}
      </View>

      {renderCategorySelector()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <>
          {isTableView ? (
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              renderItem={renderTableRow}
              ListHeaderComponent={renderTableHeader}
              ListEmptyComponent={renderEmptyState}
              refreshing={loading}
              onRefresh={onRefresh}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={[0]}
            />
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              renderItem={renderCardItem}
              ListEmptyComponent={renderEmptyState}
              refreshing={loading}
              onRefresh={onRefresh}
              numColumns={isTablet() ? 2 : 1}
              key={isTablet() ? 'tablet-grid' : 'phone-list'}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={
                isTablet() && { justifyContent: 'space-between' }
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    paddingHorizontal: wp(3),
    height: hp(6),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: wp(2),
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(3.8),
    color: colors.text,
  },
  categoriesContainer: {
    paddingTop: hp(1),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
  },
  categoryChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusXLarge,
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: wp(3.5),
    color: colors.text,
  },
  selectedCategoryText: {
    color: colors.white,
    fontWeight: '500',
  },
  viewSelectorContainer: {
    flexDirection: 'row',
    marginLeft: wp(3),
  },
  viewSelector: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: dimensions.borderRadiusMedium,
  },
  viewSelectorActive: {
    backgroundColor: `${colors.primary}20`,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: wp(4),
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
    marginTop: hp(10),
  },
  emptyTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptyText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
    maxWidth: wp(70),
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: hp(2),
  },
  gridContent: {
    flexGrow: 1,
    padding: wp(4),
    paddingBottom: hp(2),
  },

  // Estilos de vista de tarjeta
  card: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
    ...(isTablet() && { width: wp(45), marginHorizontal: wp(1) }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  productName: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  stockIndicator: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginLeft: wp(2),
  },
  inStockIndicator: {
    backgroundColor: colors.success,
  },
  lowStockIndicator: {
    backgroundColor: colors.warning,
  },
  outOfStockIndicator: {
    backgroundColor: colors.danger,
  },
  cardContent: {
    marginBottom: hp(2),
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  cardLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  cardValue: {
    fontSize: wp(3.5),
    color: colors.text,
    fontWeight: '500',
  },
  cardCategory: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: dimensions.borderRadiusSmall,
    marginTop: hp(1),
  },
  categoryText: {
    fontSize: wp(3.2),
    color: colors.primary,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.3,
    shadowRadius: wp(1),
    elevation: 3,
  },

  // Estilos de vista de tabla
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(1),
  },
  tableHeaderText: {
    fontSize: wp(3.8),
    fontWeight: '600',
    color: colors.text,
    marginRight: wp(1),
  },
  tableHeaderProduct: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderPrice: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderStock: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowProduct: {
    flex: 3,
    justifyContent: 'center',
  },
  productNameTable: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  productSku: {
    fontSize: wp(3.2),
    color: colors.textLight,
  },
  tableRowPrice: {
    flex: 2,
    justifyContent: 'center',
  },
  priceText: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: colors.text,
  },
  tableRowStock: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  stockBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: dimensions.borderRadiusSmall,
  },
  inStockBadge: {
    backgroundColor: `${colors.success}15`,
  },
  lowStockBadge: {
    backgroundColor: `${colors.warning}15`,
  },
  outOfStockBadge: {
    backgroundColor: `${colors.danger}15`,
  },
  stockText: {
    fontSize: wp(3.2),
    fontWeight: '500',
  },
  inStockText: {
    color: colors.success,
  },
  lowStockText: {
    color: colors.warning,
  },
  outOfStockText: {
    color: colors.danger,
  },
  tableRowActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: colors.primary,
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
});

export default ProductListComponent;
