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
  Modal,
  FlatList,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { InventoryContext } from '../context/InventoryContext';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';
import colors from '../constants/colors';

const AddProductScreen = ({ navigation }) => {
  // Estados para los campos del producto
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para el modal de categorías
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);

  const { addProduct, categories, addCategory } = useContext(InventoryContext);

  // Filtrar categorías según la búsqueda
  useEffect(() => {
    if (categorySearch.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearch, categories]);

  // Función para seleccionar una imagen de la galería
  const pickImage = async () => {
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

  // Función para guardar el producto
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

      // Crear el objeto de producto
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

      // Añadir el producto a Firestore
      await addProduct(productData, imageToUpload);

      Alert.alert('Éxito', 'Producto añadido correctamente', [
        {
          text: 'Añadir otro producto',
          onPress: () => {
            // Reiniciar el formulario pero mantener la categoría seleccionada
            const selectedCategory = category;
            resetForm();
            setCategory(selectedCategory);
          },
        },
        {
          text: 'Volver a Inventario',
          onPress: () => {
            // Navegar a la pestaña de Inventario y luego a la pantalla de lista
            navigation.navigate('Inventory', { screen: 'InventoryList' });
          },
        },
      ]);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setName('');
    setSku('');
    setDescription('');
    setPrice('');
    setCost('');
    setQuantity('');
    setImage(null);
    // No reseteamos la categoría para poder añadir varios productos de la misma categoría
  };

  // Seleccionar una categoría del modal
  const selectCategory = categoryName => {
    setCategory(categoryName);
    setShowCategoryModal(false);
    setCategorySearch('');
  };

  // Función para añadir una nueva categoría desde el modal
  const addNewCategory = async () => {
    if (categorySearch.trim() === '') {
      Alert.alert('Error', 'Ingresa un nombre para la categoría');
      return;
    }

    // Comprobar si la categoría ya existe
    const exists = categories.some(
      cat => cat.name.toLowerCase() === categorySearch.toLowerCase()
    );

    if (exists) {
      Alert.alert(
        'Categoría Existente',
        'Esta categoría ya existe, selecciónala de la lista'
      );
      return;
    }

    try {
      setLoading(true);
      // Llamar a la función para añadir la categoría a la base de datos
      await addCategory({ name: categorySearch.trim() });

      setCategory(categorySearch);
      setShowCategoryModal(false);
      setCategorySearch('');
    } catch (error) {
      console.error('Error al añadir categoría:', error);
      Alert.alert('Error', 'No se pudo guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar cada categoría en la lista
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => selectCategory(item.name)}
    >
      <Text style={styles.categoryName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={wp(5)} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Añadir Producto</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sección de imagen */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={wp(10)}
                    color={colors.textMuted}
                  />
                  <Text style={styles.imagePlaceholderText}>Añadir imagen</Text>
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
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre del producto"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>SKU / Código</Text>
              <TextInput
                style={styles.input}
                value={sku}
                onChangeText={setSku}
                placeholder="Código único del producto (opcional)"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción del producto"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryModal(true)}
              >
                <TextInput
                  style={styles.categoryInput}
                  value={category}
                  placeholder="Seleccionar categoría"
                  editable={false}
                  placeholderTextColor={colors.textMuted}
                />
                <Ionicons
                  name="chevron-down"
                  size={wp(5)}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Precios y Stock */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precios y Stock</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Precio de Venta *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Costo *</Text>
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cantidad Inicial *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveProduct}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Producto</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal de selector de categoría */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowCategoryModal(false);
                    setCategorySearch('');
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
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                    placeholder="Buscar o crear categoría"
                    autoFocus
                    placeholderTextColor={colors.textMuted}
                  />
                  {categorySearch ? (
                    <TouchableOpacity onPress={() => setCategorySearch('')}>
                      <Ionicons
                        name="close-circle"
                        size={wp(5)}
                        color={colors.textLight}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {categorySearch.trim() !== '' &&
                !filteredCategories.some(
                  cat => cat.name.toLowerCase() === categorySearch.toLowerCase()
                ) && (
                  <TouchableOpacity
                    style={styles.addNewCategoryButton}
                    onPress={addNewCategory}
                  >
                    <Ionicons
                      name="add-circle"
                      size={wp(5)}
                      color={colors.primary}
                    />
                    <Text style={styles.addNewCategoryText}>
                      Añadir "{categorySearch}" como nueva categoría
                    </Text>
                  </TouchableOpacity>
                )}

              <FlatList
                data={filteredCategories}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={renderCategoryItem}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>
                      {categorySearch.trim() !== ''
                        ? 'No se encontraron categorías. Puedes añadir una nueva.'
                        : 'No hay categorías disponibles'}
                    </Text>
                  </View>
                }
                style={styles.categoriesList}
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
    padding: wp(4),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(12),
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  imageContainer: {
    width: isTablet() ? wp(30) : wp(50),
    height: isTablet() ? wp(30) : wp(50),
    borderRadius: dimensions.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  imagePlaceholderText: {
    marginTop: hp(1),
    color: colors.textLight,
    fontSize: wp(3.5),
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(2.5),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(2),
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  inputLabel: {
    fontSize: wp(4),
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
  textArea: {
    minHeight: hp(15),
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: wp(3),
  },
  categoryInput: {
    flex: 1,
    fontSize: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: isTablet() ? hp(1.5) : hp(1.8),
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

  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: dimensions.borderRadiusLarge,
    borderTopRightRadius: dimensions.borderRadiusLarge,
    height: isTablet() ? '60%' : '70%',
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
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: wp(1),
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
  categoriesList: {
    paddingHorizontal: wp(4),
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  categoryName: {
    fontSize: wp(4),
    color: colors.text,
  },
  addNewCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: `${colors.primary}10`,
  },
  addNewCategoryText: {
    marginLeft: wp(2),
    fontSize: wp(4),
    color: colors.primary,
  },
  emptyListContainer: {
    padding: wp(5),
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default AddProductScreen;
