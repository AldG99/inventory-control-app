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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import colors from '../constants/colors';

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
 padding: 16,
 backgroundColor: colors.white,
 borderBottomWidth: 1,
 borderBottomColor: colors.border,
 },
 headerTitle: {
 fontSize: 20,
 fontWeight: 'bold',
 color: colors.text,
 },
 addProductButton: {
 flexDirection: 'row',
 backgroundColor: colors.primary,
 paddingVertical: 8,
 paddingHorizontal: 12,
 borderRadius: 8,
 alignItems: 'center',
 },
 addProductButtonText: {
 color: colors.white,
 fontWeight: 'bold',
 marginLeft: 4,
 },
 cartList: {
 padding: 16,
 },
 cartItem: {
 backgroundColor: colors.white,
 borderRadius: 8,
 padding: 12,
 marginBottom: 12,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 1 },
 shadowOpacity: 0.1,
 shadowRadius: 2,
 elevation: 2,
 },
 cartItemInfo: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 marginBottom: 8,
 },
 cartItemName: {
 fontSize: 16,
 fontWeight: '500',
 color: colors.text,
 flex: 1,
 },
 cartItemPrice: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 },
 cartItemActions: {
 flexDirection: 'row',
 alignItems: 'center',
 marginBottom: 8,
 },
 quantityButton: {
 width: 36,
 height: 36,
 borderRadius: 18,
 borderWidth: 1,
 borderColor: colors.border,
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: colors.white,
 },
 quantityText: {
 fontSize: 16,
 color: colors.text,
 marginHorizontal: 12,
 minWidth: 30,
 textAlign: 'center',
 },
 removeButton: {
 marginLeft: 'auto',
 padding: 8,
 },
 cartItemSubtotal: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.primary,
 textAlign: 'right',
 },
 emptyCart: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 20,
 },
 emptyCartTitle: {
 fontSize: 20,
 fontWeight: 'bold',
 color: colors.text,
 marginVertical: 12,
 },
 emptyCartText: {
 fontSize: 16,
 color: colors.textLight,
 textAlign: 'center',
 marginBottom: 20,
 },
 emptyCartButton: {
 backgroundColor: colors.primary,
 paddingVertical: 12,
 paddingHorizontal: 20,
 borderRadius: 8,
 },
 emptyCartButtonText: {
 color: colors.white,
 fontWeight: 'bold',
 fontSize: 16,
 },
 saleDetails: {
 backgroundColor: colors.white,
 margin: 16,
 borderRadius: 12,
 padding: 16,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.1,
 shadowRadius: 4,
 elevation: 2,
 },
 sectionTitle: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 12,
 },
 paymentMethodContainer: {
 marginBottom: 16,
 },
 paymentOptions: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 },
 paymentOption: {
 flex: 1,
 alignItems: 'center',
 padding: 12,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: colors.border,
 marginHorizontal: 4,
 },
 selectedPaymentOption: {
 borderColor: colors.primary,
 backgroundColor: colors.primaryLight + '20', // 20% de opacidad
 },
 paymentOptionText: {
 fontSize: 14,
 color: colors.text,
 marginTop: 4,
 },
 selectedPaymentOptionText: {
 color: colors.primary,
 fontWeight: '500',
 },
 notesContainer: {
 marginBottom: 16,
 },
 notesInput: {
 backgroundColor: colors.background,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: colors.border,
 padding: 12,
 height: 80,
 textAlignVertical: 'top',
 },
 summaryContainer: {
 borderTopWidth: 1,
 borderTopColor: colors.grayLight,
 paddingTop: 16,
 },
 summaryRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 marginBottom: 8,
 },
 summaryLabel: {
 fontSize: 14,
 color: colors.textLight,
 },
 summaryValue: {
 fontSize: 14,
 color: colors.text,
 fontWeight: '500',
 },
 totalRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 marginTop: 8,
 paddingTop: 8,
 borderTopWidth: 1,
 borderTopColor: colors.grayLight,
 },
 totalLabel: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 },
 totalValue: {
 fontSize: 18,
 fontWeight: 'bold',
 color: colors.primary,
 },
 checkoutContainer: {
 padding: 16,
 backgroundColor: colors.white,
 borderTopWidth: 1,
 borderTopColor: colors.border,
 },
 checkoutButton: {
 backgroundColor: colors.success,
 flexDirection: 'row',
 height: 50,
 borderRadius: 8,
 justifyContent: 'center',
 alignItems: 'center',
 },
 checkoutButtonDisabled: {
 backgroundColor: colors.gray,
 },
 checkoutButtonText: {
 color: colors.white,
 fontSize: 16,
 fontWeight: 'bold',
 marginLeft: 8,
 },
 // Estilos para el modal
 modalOverlay: {
 flex: 1,
 backgroundColor: 'rgba(0, 0, 0, 0.5)',
 justifyContent: 'flex-end',
 },
 modalContainer: {
 backgroundColor: colors.white,
 borderTopLeftRadius: 20,
 borderTopRightRadius: 20,
 paddingBottom: 20,
 height: '80%',
 },
 modalHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 padding: 16,
 borderBottomWidth: 1,
 borderBottomColor: colors.grayLight,
 },
 modalTitle: {
 fontSize: 18,
 fontWeight: 'bold',
 color: colors.text,
 },
 closeButton: {
 padding: 4,
 },
 searchContainer: {
 padding: 16,
 },
 searchBar: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: colors.background,
 borderRadius: 8,
 paddingHorizontal: 12,
 height: 44,
 borderWidth: 1,
 borderColor: colors.border,
 },
 searchInput: {
 flex: 1,
 marginLeft: 8,
 fontSize: 16,
 color: colors.text,
 },
 productsList: {
 paddingHorizontal: 16,
 },
 productItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 12,
 borderBottomWidth: 1,
 borderBottomColor: colors.grayLight,
 },
 productInfo: {
 flex: 1,
 },
 productName: {
 fontSize: 16,
 fontWeight: '500',
 color: colors.text,
 marginBottom: 2,
 },
 productSku: {
 fontSize: 13,
 color: colors.textLight,
 marginBottom: 2,
 },
 productStock: {
 fontSize: 13,
 color: colors.success,
 },
 productPrice: {
 alignItems: 'flex-end',
 },
 priceText: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 4,
 },
 addButton: {
 backgroundColor: colors.primary,
 width: 36,
 height: 36,
 borderRadius: 18,
 justifyContent: 'center',
 alignItems: 'center',
 },
 emptyResults: {
 padding: 20,
 alignItems: 'center',
 },
 emptyResultsText: {
 fontSize: 16,
 color: colors.textLight,
 textAlign: 'center',
 },
 });

 // Añadir producto al carrito
 const addToCart = product => {
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
 <View style={styles.cartItemInfo}>
 <Text style={styles.cartItemName}>{item.productName}</Text>
 <Text style={styles.cartItemPrice}>{formatCurrency(item.price)}</Text>
 </View>

 <View style={styles.cartItemActions}>
 <TouchableOpacity
 style={styles.quantityButton}
 onPress={() => updateItemQuantity(index, item.quantity - 1)}
 >
 <Ionicons name="remove" size={20} color={colors.textLight} />
 </TouchableOpacity>

 <Text style={styles.quantityText}>{item.quantity}</Text>

 <TouchableOpacity
 style={styles.quantityButton}
 onPress={() => updateItemQuantity(index, item.quantity + 1)}
 >
 <Ionicons name="add" size={20} color={colors.textLight} />
 </TouchableOpacity>

 <TouchableOpacity
 style={styles.removeButton}
 onPress={() => removeFromCart(index)}
 >
 <Ionicons name="trash-outline" size={20} color={colors.danger} />
 </TouchableOpacity>
 </View>

 <Text style={styles.cartItemSubtotal}>
 {formatCurrency(item.price * item.quantity)}
 </Text>
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
 <Text style={styles.productStock}>
 Disponible: {item.quantity} unidades
 </Text>
 </View>
 <View style={styles.productPrice}>
 <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>
 <TouchableOpacity
 style={styles.addButton}
 onPress={() => addToCart(item)}
 >
 <Ionicons name="add" size={20} color={colors.white} />
 </TouchableOpacity>
 </View>
 </TouchableOpacity>
 );

 return (
 <SafeAreaView style={styles.safeArea}>
 <KeyboardAvoidingView
 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
 style={styles.container}
 >
 <View style={styles.container}>
 {/* Cabecera */}
 <View style={styles.header}>
 <Text style={styles.headerTitle}>Nueva Venta</Text>
 <TouchableOpacity
 style={styles.addProductButton}
 onPress={() => setShowProductModal(true)}
 >
 <Ionicons name="add" size={24} color={colors.white} />
 <Text style={styles.addProductButtonText}>Añadir Producto</Text>
 </TouchableOpacity>
 </View>

 {/* Lista de productos en el carrito */}
 {cartItems.length > 0 ? (
 <FlatList
 data={cartItems}
 renderItem={renderCartItem}
 keyExtractor={(item, index) => `${item.productId}-${index}`}
 contentContainerStyle={styles.cartList}
 />
 ) : (
 <View style={styles.emptyCart}>
 <Ionicons name="cart-outline" size={60} color={colors.gray} />
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

 {/* Detalles de la venta */}
 {cartItems.length > 0 && (
 <View style={styles.saleDetails}>
 {/* Método de pago */}
 <View style={styles.paymentMethodContainer}>
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
 size={24}
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
 paymentMethod === 'Tarjeta' &&
 styles.selectedPaymentOption,
 ]}
 onPress={() => setPaymentMethod('Tarjeta')}
 >
 <Ionicons
 name="card-outline"
 size={24}
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
 size={24}
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
 </View>

 {/* Notas */}
 <View style={styles.notesContainer}>
 <Text style={styles.sectionTitle}>Notas (Opcional)</Text>
 <TextInput
 style={styles.notesInput}
 value={notes}
 onChangeText={setNotes}
 placeholder="Añadir notas sobre la venta..."
 multiline
 numberOfLines={2}
 textAlignVertical="top"
 />
 </View>

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
 size={24}
 color={colors.white}
 />
 <Text style={styles.checkoutButtonText}>
 Finalizar Venta
 </Text>
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
 setShowProductModal(false);
 setSearchQuery('');
 }}
 >
 <Ionicons name="close" size={24} color={colors.text} />
 </TouchableOpacity>
 </View>

 <View style={styles.searchContainer}>
 <View style={styles.searchBar}>
 <Ionicons
 name="search"
 size={20}
 color={colors.textLight}
 />
 <TextInput
 style={styles.searchInput}
 value={searchQuery}
 onChangeText={setSearchQuery}
 placeholder="Buscar productos..."
 autoFocus
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
 </View>

 <FlatList
 data={filteredProducts}
 renderItem={renderProductItem}
 keyExtractor={item => item.id}
 contentContainerStyle={styles.productsList}
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
 </View>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
};

export default SalesScreen;
