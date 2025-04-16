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
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { InventoryContext } from '../context/InventoryContext';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';
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

      // Verificar que image sea una URI válida antes de pasarla
      const imageToUpload = image && typeof image === 'string' ? image : null;

      // Actualizar el producto en Firestore
      await updateProduct(productId, productData, imageToUpload);

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

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Imagen del producto */}
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
                <Image source={{ uri: imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={wp(15)}
                    color={colors.textMuted}
                  />
                  <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
                </View>
              )}
              {editing && (
                <View style={styles.editImageOverlay}>
                  <Ionicons name="camera" size={wp(6)} color={colors.white} />
                  <Text style={styles.editImageText}>Cambiar imagen</Text>
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
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
                      ? formatCurrency(parseFloat(price) * parseInt(quantity))
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            )}
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
                <Ionicons
                  name="trash-outline"
                  size={wp(5)}
                  color={colors.white}
                />
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
                disabled={loading}
              >
                <Ionicons
                  name="create-outline"
                  size={wp(5)}
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
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  imageContainer: {
    width: isTablet() ? wp(40) : wp(70),
    height: isTablet() ? wp(30) : wp(50),
    borderRadius: dimensions.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editableImageContainer: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  imagePlaceholderText: {
    marginTop: hp(1),
    color: colors.textLight,
    fontSize: wp(3.5),
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: wp(3),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editImageText: {
    color: colors.white,
    marginLeft: wp(2),
    fontSize: wp(3.5),
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(3),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(2),
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  inputLabel: {
    fontSize: wp(3.8),
    marginBottom: hp(1),
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    paddingHorizontal: wp(3),
    paddingVertical: isTablet() ? hp(1.5) : hp(1.8),
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: wp(4),
  },
  disabledInput: {
    backgroundColor: `${colors.background}50`,
    color: colors.text,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: hp(15),
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: hp(1),
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    padding: wp(3),
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    margin: wp(1),
  },
  statLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(0.5),
  },
  statValue: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: wp(4),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cancelButton: {
    flex: 1,
    height: hp(6.5),
    borderRadius: dimensions.borderRadiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: wp(4),
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    height: hp(6.5),
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(2),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    height: hp(6.5),
    backgroundColor: colors.danger,
    borderRadius: dimensions.borderRadiusMedium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
    elevation: 3,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontWeight: '600',
    marginLeft: wp(2),
  },
  editButton: {
    flex: 2,
    height: hp(6.5),
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadiusMedium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(2),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1),
    elevation: 3,
  },
  editButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontWeight: '600',
    marginLeft: wp(2),
  },
});

export default ProductDetailScreen;
