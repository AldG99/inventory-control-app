import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Keyboard,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import colors from '../constants/colors';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';

const SalesScreen = ({ navigation }) => {
  const { products, registerSale } = useContext(InventoryContext);

  // Estados para la venta
  const [cartItems, setCartItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calcular el total de la venta
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Filtrar productos según búsqueda
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        product =>
          (product.name?.toLowerCase().includes(query) ||
            product.sku?.toLowerCase().includes(query)) &&
          product.quantity > 0 // Solo mostrar productos con stock
      );
      setFilteredProducts(filtered);
    } else {
      // Si no hay búsqueda, mostrar todos los productos con stock
      setFilteredProducts(products.filter(product => product.quantity > 0));
    }
  }, [products, searchQuery]);

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Añadir producto al carrito
  const addToCart = product => {
    // Cerrar el teclado explícitamente
    Keyboard.dismiss();

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cartItems.findIndex(
      item => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar la cantidad
      const updatedItems = [...cartItems];
      const currentQuantity = updatedItems[existingItemIndex].quantity;

      // Verificar si hay suficiente stock
      if (currentQuantity >= product.quantity) {
        Alert.alert(
          'Stock insuficiente',
          `Solo hay ${product.quantity} unidades disponibles.`
        );
        return;
      }

      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      // Si no existe, añadirlo al carrito
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          maxQuantity: product.quantity, // Guardar la cantidad máxima disponible
        },
      ]);
    }

    // Cerrar el modal después de añadir
    setShowProductModal(false);
    setSearchQuery('');
  };

  // Eliminar producto del carrito
  const removeFromCart = index => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
  };

  // Cambiar cantidad de un producto en el carrito
  const updateItemQuantity = (index, newQuantity) => {
    const updatedItems = [...cartItems];
    const maxQuantity = updatedItems[index].maxQuantity;

    // Validar que la cantidad no exceda el stock disponible
    if (newQuantity > maxQuantity) {
      Alert.alert(
        'Stock insuficiente',
        `Solo hay ${maxQuantity} unidades disponibles.`
      );
      return;
    }

    if (newQuantity <= 0) {
      // Si la cantidad es 0 o menos, eliminar el producto
      removeFromCart(index);
    } else {
      updatedItems[index].quantity = newQuantity;
      setCartItems(updatedItems);
    }
  };

  // Registrar la venta
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert(
        'Carrito vacío',
        'Añade productos al carrito para realizar una venta.'
      );
      return;
    }

    try {
      setLoading(true);

      // Preparar los datos de la venta
      const saleData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        total: total,
        paymentMethod: paymentMethod,
        notes: notes.trim() || null,
        createdAt: new Date(),
      };

      // Registrar la venta en Firestore
      await registerSale(saleData);

      // Mostrar mensaje de éxito
      Alert.alert(
        'Venta Registrada',
        'La venta se ha registrado correctamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar carrito y otros campos
              setCartItems([]);
              setNotes('');
              setPaymentMethod('Efectivo');
              // Opcional: Navegar a otra pantalla
              // navigation.navigate('SalesHistory');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al registrar venta:', error);
      Alert.alert(
        'Error',
        'No se pudo registrar la venta. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Renderizar cada elemento del carrito
  const renderCartItem = ({ item, index }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemHeader}>
        <Text style={styles.cartItemName} numberOfLines={1}>
          {item.productName}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(index)}
        >
          <Ionicons name="close-circle" size={wp(5)} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.cartItemBody}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateItemQuantity(index, item.quantity - 1)}
          >
            <Ionicons name="remove" size={wp(4)} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateItemQuantity(index, item.quantity + 1)}
          >
            <Ionicons name="add" size={wp(4)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>
          <Text style={styles.subtotalText}>
            {formatCurrency(item.price * item.quantity)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Renderizar cada producto en el modal de búsqueda
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => addToCart(item)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.sku && <Text style={styles.productSku}>SKU: {item.sku}</Text>}
        <View style={styles.productStats}>
          <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
          <Text style={styles.productStock}>
            Stock: {item.quantity} unidades
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(item)}
      >
        <Ionicons name="add" size={wp(5)} color={colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nueva Venta</Text>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductModal(true)}
          >
            <Ionicons name="add" size={wp(5)} color={colors.white} />
            <Text style={styles.addProductButtonText}>Añadir Producto</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de productos en el carrito */}
        {cartItems.length > 0 ? (
          <ScrollView
            style={styles.cartContainer}
            contentContainerStyle={styles.cartContent}
          >
            <Text style={styles.sectionTitle}>Productos Seleccionados</Text>
            {cartItems.map((item, index) => (
              <View key={`${item.productId}-${index}`}>
                {renderCartItem({ item, index })}
              </View>
            ))}

            {/* Detalles de la venta */}
            <View style={styles.saleDetails}>
              {/* Método de pago */}
              <Text style={styles.sectionTitle}>Método de Pago</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'Efectivo' &&
                      styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod('Efectivo')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={wp(6)}
                    color={
                      paymentMethod === 'Efectivo'
                        ? colors.primary
                        : colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === 'Efectivo' &&
                        styles.selectedPaymentOptionText,
                    ]}
                  >
                    Efectivo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'Tarjeta' && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod('Tarjeta')}
                >
                  <Ionicons
                    name="card-outline"
                    size={wp(6)}
                    color={
                      paymentMethod === 'Tarjeta'
                        ? colors.primary
                        : colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === 'Tarjeta' &&
                        styles.selectedPaymentOptionText,
                    ]}
                  >
                    Tarjeta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'Transferencia' &&
                      styles.selectedPaymentOption,
                  ]}
                  onPress={() => setPaymentMethod('Transferencia')}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={wp(6)}
                    color={
                      paymentMethod === 'Transferencia'
                        ? colors.primary
                        : colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === 'Transferencia' &&
                        styles.selectedPaymentOptionText,
                    ]}
                  >
                    Transferencia
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Notas */}
              <Text style={styles.sectionTitle}>Notas (Opcional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Añadir notas sobre la venta..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />

              {/* Resumen */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(total)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Impuestos</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(0)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyCart}>
            <Ionicons
              name="cart-outline"
              size={wp(15)}
              color={colors.textMuted}
            />
            <Text style={styles.emptyCartTitle}>Carrito Vacío</Text>
            <Text style={styles.emptyCartText}>
              Añade productos para registrar una venta
            </Text>
            <TouchableOpacity
              style={styles.emptyCartButton}
              onPress={() => setShowProductModal(true)}
            >
              <Text style={styles.emptyCartButtonText}>Añadir Productos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón para finalizar venta */}
        {cartItems.length > 0 && (
          <View style={styles.checkoutContainer}>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                loading && styles.checkoutButtonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={wp(5)}
                    color={colors.white}
                  />
                  <Text style={styles.checkoutButtonText}>Finalizar Venta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Modal para buscar y añadir productos */}
        <Modal
          visible={showProductModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Añadir Productos</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowProductModal(false);
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="close" size={wp(6)} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Ionicons
                    name="search"
                    size={wp(5)}
                    color={colors.textLight}
                  />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar productos..."
                    autoFocus
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
              </View>

              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.productsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyResults}>
                    <Text style={styles.emptyResultsText}>
                      {searchQuery
                        ? 'No se encontraron productos que coincidan con la búsqueda'
                        : 'No hay productos disponibles'}
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
  },
  addProductButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: dimensions.borderRadiusMedium,
    alignItems: 'center',
  },
  addProductButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: wp(1),
    fontSize: wp(3.5),
  },
  cartContainer: {
    flex: 1,
  },
  cartContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(2),
    marginTop: hp(1),
  },
  cartItem: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(1),
    elevation: 2,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  cartItemName: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  removeButton: {
    padding: wp(1),
  },
  cartItemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    overflow: 'hidden',
  },
  quantityButton: {
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    width: wp(8),
    textAlign: 'center',
    fontSize: wp(4),
    fontWeight: '500',
    color: colors.text,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(0.5),
  },
  subtotalText: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: colors.primary,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(3),
  },
  paymentOption: {
    alignItems: 'center',
    padding: wp(3),
    borderRadius: dimensions.borderRadiusMedium,
    borderWidth: 1,
    borderColor: colors.border,
    width: wp(25),
  },
  selectedPaymentOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  paymentOptionText: {
    fontSize: wp(3.5),
    color: colors.text,
    marginTop: hp(0.5),
  },
  selectedPaymentOptionText: {
    color: colors.primary,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: wp(3),
    fontSize: wp(3.8),
    color: colors.text,
    minHeight: hp(15),
    marginBottom: hp(3),
    textAlignVertical: 'top',
  },
  saleDetails: {
    marginTop: hp(2),
  },
  summaryContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(1),
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  summaryLabel: {
    fontSize: wp(3.8),
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: wp(3.8),
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: hp(1.5),
    marginTop: hp(1),
  },
  totalLabel: {
    fontSize: wp(4.2),
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  emptyCartTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptyCartText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: hp(3),
  },
  emptyCartButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: dimensions.borderRadiusMedium,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
    elevation: 3,
  },
  emptyCartButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: wp(4),
  },
  checkoutContainer: {
    padding: wp(4),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  checkoutButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    height: hp(6.5),
    borderRadius: dimensions.borderRadiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
    elevation: 3,
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  checkoutButtonText: {
    color: colors.white,
    fontSize: wp(4.5),
    fontWeight: '600',
    marginLeft: wp(2),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: dimensions.borderRadiusLarge,
    borderTopRightRadius: dimensions.borderRadiusLarge,
    height: isTablet() ? '60%' : '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: wp(2),
  },
  searchContainer: {
    padding: wp(4),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    paddingHorizontal: wp(3),
    height: hp(6),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(4),
    color: colors.text,
  },
  productsList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: wp(4),
    fontWeight: '500',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  productSku: {
    fontSize: wp(3.2),
    color: colors.textLight,
    marginBottom: hp(0.8),
  },
  productStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: wp(3.8),
    fontWeight: '600',
    color: colors.primary,
    marginRight: wp(3),
  },
  productStock: {
    fontSize: wp(3.2),
    color: colors.textLight,
  },
  addButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
    elevation: 2,
  },
  emptyResults: {
    padding: wp(10),
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default SalesScreen;
