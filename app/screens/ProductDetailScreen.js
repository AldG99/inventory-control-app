import React, { useState, useContext, useEffect } from 'react';
import {
 StyleSheet,
 View,
 Text,
 TextInput,
 TouchableOpacity,
 ScrollView,
 Image,
 Alert,
 ActivityIndicator,
 KeyboardAvoidingView,
 Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { InventoryContext } from '../context/InventoryContext';
import colors from '../constants/colors';

const ProductDetailScreen = ({ route, navigation }) => {
 const { productId } = route.params;
 const { products, updateProduct, deleteProduct } =
 useContext(InventoryContext);

 // Encontrar el producto por ID
 const product = products.find(p => p.id === productId);

 // Estados para los campos del producto
 const [name, setName] = useState('');
 const [sku, setSku] = useState('');
 const [description, setDescription] = useState('');
 const [category, setCategory] = useState('');
 const [price, setPrice] = useState('');
 const [cost, setCost] = useState('');
 const [quantity, setQuantity] = useState('');
 const [image, setImage] = useState(null);
 const [imageUrl, setImageUrl] = useState('');
 const [loading, setLoading] = useState(false);
 const [editing, setEditing] = useState(false);

 // Cargar datos del producto cuando se encuentra
 useEffect(() => {
 if (product) {
 setName(product.name || '');
 setSku(product.sku || '');
 setDescription(product.description || '');
 setCategory(product.category || '');
 setPrice(product.price?.toString() || '');
 setCost(product.cost?.toString() || '');
 setQuantity(product.quantity?.toString() || '');
 setImageUrl(product.imageUrl || '');
 } else {
 Alert.alert('Error', 'Producto no encontrado');
 navigation.goBack();
 }
 }, [product]);

 // Función para seleccionar una imagen de la galería
 const pickImage = async () => {
 if (!editing) return;

 try {
 // Solicitar permisos para acceder a la galería
 const { status } =
 await ImagePicker.requestMediaLibraryPermissionsAsync();
 if (status !== 'granted') {
 Alert.alert(
 'Permiso requerido',
 'Se necesita permiso para acceder a la galería'
 );
 return;
 }

 // Abrir el selector de imágenes
 const result = await ImagePicker.launchImageLibraryAsync({
 mediaTypes: ImagePicker.MediaTypeOptions.Images,
 allowsEditing: true,
 aspect: [4, 3],
 quality: 0.8,
 });

 if (!result.canceled && result.assets && result.assets.length > 0) {
 setImage(result.assets[0].uri);
 }
 } catch (error) {
 console.error('Error al seleccionar imagen:', error);
 Alert.alert('Error', 'No se pudo seleccionar la imagen');
 }
 };

 // Función para guardar cambios en el producto
 const handleSaveProduct = async () => {
 // Validaciones básicas
 if (!name.trim()) {
 Alert.alert('Error', 'El nombre del producto es obligatorio');
 return;
 }

 // Convertir a números
 const priceNumber = parseFloat(price);
 const costNumber = parseFloat(cost);
 const quantityNumber = parseInt(quantity);

 // Validar que sean números válidos
 if (isNaN(priceNumber) || priceNumber <= 0) {
 Alert.alert('Error', 'El precio debe ser un número mayor que cero');
 return;
 }

 if (isNaN(costNumber) || costNumber <= 0) {
 Alert.alert('Error', 'El costo debe ser un número mayor que cero');
 return;
 }

 if (isNaN(quantityNumber) || quantityNumber < 0) {
 Alert.alert('Error', 'La cantidad debe ser un número válido no negativo');
 return;
 }

 try {
 setLoading(true);

 // Crear el objeto de producto actualizado
 const productData = {
 name,
 sku: sku.trim() || null,
 description: description.trim() || null,
 category: category.trim() || 'Sin categoría',
 price: priceNumber,
 cost: costNumber,
 quantity: quantityNumber,
 };

 // Actualizar el producto en Firestore
 await updateProduct(productId, productData, image);

 Alert.alert('Éxito', 'Producto actualizado correctamente', [
 { text: 'OK' },
 ]);

 setEditing(false);
 } catch (error) {
 console.error('Error al actualizar producto:', error);
 Alert.alert('Error', 'No se pudo actualizar el producto');
 } finally {
 setLoading(false);
 }
 };

 // Función para eliminar el producto
 const handleDeleteProduct = () => {
 Alert.alert('Eliminar Producto', `¿Estás seguro de eliminar "${name}"?`, [
 { text: 'Cancelar', style: 'cancel' },
 {
 text: 'Eliminar',
 style: 'destructive',
 onPress: async () => {
 try {
 setLoading(true);
 await deleteProduct(productId);
 navigation.goBack();
 } catch (error) {
 console.error('Error al eliminar producto:', error);
 Alert.alert('Error', 'No se pudo eliminar el producto');
 setLoading(false);
 }
 },
 },
 ]);
 };

 if (!product) {
 return (
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color={colors.primary} />
 </View>
 );
 }

 return (
 <SafeAreaView style={styles.safeArea}>
 <KeyboardAvoidingView
 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
 style={styles.container}
 >
 <ScrollView style={styles.scrollView}>
 <View style={styles.formContainer}>
 {/* Sección de imagen */}
 <View style={styles.imageSection}>
 <TouchableOpacity
 style={[
 styles.imageContainer,
 editing && styles.editableImageContainer,
 ]}
 onPress={pickImage}
 disabled={!editing}
 >
 {image ? (
 <Image source={{ uri: image }} style={styles.productImage} />
 ) : imageUrl ? (
 <Image
 source={{ uri: imageUrl }}
 style={styles.productImage}
 />
 ) : (
 <View style={styles.imagePlaceholder}>
 <Ionicons
 name="image-outline"
 size={40}
 color={colors.textLight}
 />
 <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
 </View>
 )}
 {editing && (
 <View style={styles.editImageOverlay}>
 <Ionicons name="camera" size={24} color={colors.white} />
 </View>
 )}
 </TouchableOpacity>
 </View>

 {/* Información básica */}
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Información Básica</Text>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>Nombre del Producto *</Text>
 <TextInput
 style={[styles.input, !editing && styles.disabledInput]}
 value={name}
 onChangeText={setName}
 placeholder="Nombre del producto"
 editable={editing}
 />
 </View>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>SKU / Código</Text>
 <TextInput
 style={[styles.input, !editing && styles.disabledInput]}
 value={sku}
 onChangeText={setSku}
 placeholder="Código único del producto (opcional)"
 editable={editing}
 />
 </View>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>Descripción</Text>
 <TextInput
 style={[
 styles.input,
 styles.textArea,
 !editing && styles.disabledInput,
 ]}
 value={description}
 onChangeText={setDescription}
 placeholder="Descripción del producto"
 multiline
 numberOfLines={4}
 textAlignVertical="top"
 editable={editing}
 />
 </View>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>Categoría</Text>
 <TextInput
 style={[styles.input, !editing && styles.disabledInput]}
 value={category}
 onChangeText={setCategory}
 placeholder="Categoría del producto"
 editable={editing}
 />
 </View>
 </View>

 {/* Precios y Stock */}
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Precios y Stock</Text>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>Precio de Venta *</Text>
 <TextInput
 style={[styles.input, !editing && styles.disabledInput]}
 value={price}
 onChangeText={setPrice}
 placeholder="0.00"
 keyboardType="decimal-pad"
 editable={editing}
 />
 </View>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>Costo *</Text>
 <TextInput
 style={[styles.input, !editing && styles.disabledInput]}
 value={cost}
 onChangeText={setCost}
 placeholder="0.00"
 keyboardType="decimal-pad"
 editable={editing}
 />
 </View>

 <View style={styles.inputContainer}>
 <Text style={styles.inputLabel}>Cantidad *</Text>
 <TextInput
 style={[styles.input, !editing && styles.disabledInput]}
 value={quantity}
 onChangeText={setQuantity}
 placeholder="0"
 keyboardType="number-pad"
 editable={editing}
 />
 </View>

 {!editing && (
 <View style={styles.statsContainer}>
 <View style={styles.statItem}>
 <Text style={styles.statLabel}>Margen</Text>
 <Text style={styles.statValue}>
 {parseFloat(price) && parseFloat(cost)
 ? `${(
 ((parseFloat(price) - parseFloat(cost)) /
 parseFloat(price)) *
 100
 ).toFixed(2)}%`
 : 'N/A'}
 </Text>
 </View>
 <View style={styles.statItem}>
 <Text style={styles.statLabel}>Valor Total</Text>
 <Text style={styles.statValue}>
 {parseFloat(price) && parseInt(quantity)
 ? new Intl.NumberFormat('es-ES', {
 style: 'currency',
 currency: 'EUR',
 }).format(parseFloat(price) * parseInt(quantity))
 : 'N/A'}
 </Text>
 </View>
 </View>
 )}
 </View>
 </View>
 </ScrollView>

 {/* Botones de acción */}
 <View style={styles.actionButtons}>
 {editing ? (
 <>
 <TouchableOpacity
 style={styles.cancelButton}
 onPress={() => setEditing(false)}
 disabled={loading}
 >
 <Text style={styles.cancelButtonText}>Cancelar</Text>
 </TouchableOpacity>

 <TouchableOpacity
 style={[
 styles.saveButton,
 loading && styles.saveButtonDisabled,
 ]}
 onPress={handleSaveProduct}
 disabled={loading}
 >
 {loading ? (
 <ActivityIndicator color={colors.white} size="small" />
 ) : (
 <Text style={styles.saveButtonText}>Guardar Cambios</Text>
 )}
 </TouchableOpacity>
 </>
 ) : (
 <>
 <TouchableOpacity
 style={styles.deleteButton}
 onPress={handleDeleteProduct}
 disabled={loading}
 >
 <Ionicons name="trash-outline" size={20} color={colors.white} />
 <Text style={styles.deleteButtonText}>Eliminar</Text>
 </TouchableOpacity>

 <TouchableOpacity
 style={styles.editButton}
 onPress={() => setEditing(true)}
 disabled={loading}
 >
 <Ionicons
 name="create-outline"
 size={20}
 color={colors.white}
 />
 <Text style={styles.editButtonText}>Editar</Text>
 </TouchableOpacity>
 </>
 )}
 </View>
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
 scrollView: {
 flex: 1,
 },
 formContainer: {
 padding: 16,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: colors.background,
 },
 imageSection: {
 alignItems: 'center',
 marginBottom: 20,
 },
 imageContainer: {
 width: 150,
 height: 150,
 borderRadius: 12,
 overflow: 'hidden',
 backgroundColor: colors.white,
 borderWidth: 1,
 borderColor: colors.border,
 },
 editableImageContainer: {
 borderStyle: 'dashed',
 },
 productImage: {
 width: '100%',
 height: '100%',
 },
 imagePlaceholder: {
 width: '100%',
 height: '100%',
 justifyContent: 'center',
 alignItems: 'center',
 },
 imagePlaceholderText: {
 marginTop: 8,
 color: colors.textLight,
 },
 editImageOverlay: {
 position: 'absolute',
 bottom: 0,
 left: 0,
 right: 0,
 backgroundColor: 'rgba(0,0,0,0.5)',
 height: 40,
 justifyContent: 'center',
 alignItems: 'center',
 },
 section: {
 backgroundColor: colors.white,
 borderRadius: 12,
 padding: 16,
 marginBottom: 20,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.1,
 shadowRadius: 4,
 elevation: 2,
 },
 sectionTitle: {
 fontSize: 18,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 16,
 },
 inputContainer: {
 marginBottom: 16,
 },
 inputLabel: {
 fontSize: 16,
 marginBottom: 8,
 color: colors.text,
 },
 input: {
 height: 50,
 backgroundColor: colors.background,
 borderRadius: 8,
 paddingHorizontal: 16,
 borderWidth: 1,
 borderColor: colors.border,
 fontSize: 16,
 },
 disabledInput: {
 backgroundColor: colors.grayLight,
 color: colors.text,
 },
 textArea: {
 height: 100,
 textAlignVertical: 'top',
 paddingTop: 12,
 },
 statsContainer: {
 flexDirection: 'row',
 marginTop: 8,
 justifyContent: 'space-between',
 },
 statItem: {
 flex: 1,
 padding: 12,
 backgroundColor: colors.background,
 borderRadius: 8,
 margin: 4,
 },
 statLabel: {
 fontSize: 14,
 color: colors.textLight,
 marginBottom: 4,
 },
 statValue: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 },
 actionButtons: {
 flexDirection: 'row',
 padding: 16,
 backgroundColor: colors.white,
 borderTopWidth: 1,
 borderTopColor: colors.border,
 },
 cancelButton: {
 flex: 1,
 height: 50,
 borderRadius: 8,
 justifyContent: 'center',
 alignItems: 'center',
 marginRight: 8,
 borderWidth: 1,
 borderColor: colors.border,
 },
 cancelButtonText: {
 color: colors.text,
 fontSize: 16,
 fontWeight: '500',
 },
 saveButton: {
 flex: 2,
 height: 50,
 backgroundColor: colors.primary,
 borderRadius: 8,
 justifyContent: 'center',
 alignItems: 'center',
 marginLeft: 8,
 },
 saveButtonDisabled: {
 backgroundColor: colors.gray,
 },
 saveButtonText: {
 color: colors.white,
 fontSize: 16,
 fontWeight: 'bold',
 },
 deleteButton: {
 flex: 1,
 height: 50,
 backgroundColor: colors.danger,
 borderRadius: 8,
 flexDirection: 'row',
 justifyContent: 'center',
 alignItems: 'center',
 marginRight: 8,
 },
 deleteButtonText: {
 color: colors.white,
 fontSize: 16,
 fontWeight: 'bold',
 marginLeft: 8,
 },
 editButton: {
 flex: 2,
 height: 50,
 backgroundColor: colors.primary,
 borderRadius: 8,
 flexDirection: 'row',
 justifyContent: 'center',
 alignItems: 'center',
 marginLeft: 8,
 },
 editButtonText: {
 color: colors.white,
 fontSize: 16,
 fontWeight: 'bold',
 marginLeft: 8,
 },
});

export default ProductDetailScreen;
