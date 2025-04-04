import React, { useState, useContext } from 'react';
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

  const { addProduct } = useContext(InventoryContext);

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

      // Añadir el producto a Firestore
      await addProduct(productData, image);

      Alert.alert('Éxito', 'Producto añadido correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('InventoryList'),
        },
      ]);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

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
                style={styles.imageContainer}
                onPress={pickImage}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={40}
                      color={colors.textLight}
                    />
                    <Text style={styles.imagePlaceholderText}>
                      Añadir imagen
                    </Text>
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
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>SKU / Código</Text>
                <TextInput
                  style={styles.input}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="Código único del producto (opcional)"
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
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Categoría del producto"
                />
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
                />
              </View>
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
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
});

export default AddProductScreen;
