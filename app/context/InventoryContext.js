import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebaseService';
import { AuthContext } from './AuthContext';
import COLLECTIONS from '../constants/collections';

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos cuando el usuario está autenticado
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Escuchar cambios en la colección de productos
    const unsubscribeProducts = onSnapshot(
      collection(db, COLLECTIONS.PRODUCTS),
      snapshot => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setLoading(false);
      },
      error => {
        console.error('Error al cargar productos:', error);
        setLoading(false);
      }
    );

    // Escuchar cambios en la colección de categorías
    const unsubscribeCategories = onSnapshot(
      collection(db, COLLECTIONS.CATEGORIES),
      snapshot => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [user]);

  // Añadir un nuevo producto
  const addProduct = async (productData, image = null) => {
    try {
      let imageUrl = null;

      // Subir imagen si existe y es válida
      if (image && typeof image === 'string' && image.trim() !== '') {
        try {
          // Verificar que storage esté inicializado
          if (!storage) {
            console.error(
              'Firebase storage no está inicializado correctamente'
            );
            throw new Error('Storage no inicializado');
          }

          const imageRef = ref(storage, `products/${Date.now()}`);

          // Verificar si la imagen es una URI válida
          if (
            image.startsWith('file://') ||
            image.startsWith('content://') ||
            image.startsWith('http')
          ) {
            const response = await fetch(image);
            if (!response.ok) {
              throw new Error(
                `Error al obtener la imagen: ${response.statusText}`
              );
            }
            const blob = await response.blob();
            await uploadBytes(imageRef, blob);
            imageUrl = await getDownloadURL(imageRef);
          } else {
            console.error('Formato de imagen no válido:', image);
          }
        } catch (imageError) {
          console.error('Error al procesar la imagen:', imageError);
          // Continuamos sin la imagen en lugar de fallar toda la operación
        }
      }

      // Añadir producto a Firestore (incluso si la imagen falló)
      const newProduct = {
        ...productData,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      const docRef = await addDoc(
        collection(db, COLLECTIONS.PRODUCTS),
        newProduct
      );

      // Registrar movimiento de inventario inicial
      await addDoc(collection(db, COLLECTIONS.INVENTORY_MOVEMENTS), {
        productId: docRef.id,
        quantity: productData.quantity,
        type: 'initial',
        note: 'Inventario inicial',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      return { id: docRef.id, ...newProduct };
    } catch (error) {
      console.error('Error al añadir producto:', error);
      throw error;
    }
  };

  // Actualizar un producto existente
  const updateProduct = async (productId, productData, image = null) => {
    try {
      let updateData = { ...productData, updatedAt: serverTimestamp() };

      // Subir nueva imagen si existe y es válida
      if (image && typeof image === 'string' && image.trim() !== '') {
        try {
          if (!storage) {
            console.error(
              'Firebase storage no está inicializado correctamente'
            );
            throw new Error('Storage no inicializado');
          }

          const imageRef = ref(storage, `products/${Date.now()}`);

          if (
            image.startsWith('file://') ||
            image.startsWith('content://') ||
            image.startsWith('http')
          ) {
            const response = await fetch(image);
            if (!response.ok) {
              throw new Error(
                `Error al obtener la imagen: ${response.statusText}`
              );
            }
            const blob = await response.blob();
            await uploadBytes(imageRef, blob);
            updateData.imageUrl = await getDownloadURL(imageRef);
          } else {
            console.error('Formato de imagen no válido:', image);
          }
        } catch (imageError) {
          console.error(
            'Error al procesar la imagen en updateProduct:',
            imageError
          );
          // Continuamos sin actualizar la imagen
        }
      }

      await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), updateData);
      return { id: productId, ...updateData };
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  };

  // Eliminar un producto
  const deleteProduct = async productId => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
      return productId;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  };

  // Añadir categoría
  const addCategory = async categoryData => {
    try {
      const newCategory = {
        ...categoryData,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(
        collection(db, COLLECTIONS.CATEGORIES),
        newCategory
      );
      return { id: docRef.id, ...newCategory };
    } catch (error) {
      console.error('Error al añadir categoría:', error);
      throw error;
    }
  };

  // Registrar una venta
  const registerSale = async saleData => {
    try {
      // Añadir la venta a Firestore
      const newSale = {
        ...saleData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      };

      const saleRef = await addDoc(collection(db, COLLECTIONS.SALES), newSale);

      // Actualizar el inventario para cada producto vendido
      for (const item of saleData.items) {
        // Obtener producto actual
        const productRef = doc(db, COLLECTIONS.PRODUCTS, item.productId);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
          const currentQuantity = productDoc.data().quantity;

          // Actualizar cantidad
          await updateDoc(productRef, {
            quantity: currentQuantity - item.quantity,
            updatedAt: serverTimestamp(),
          });

          // Registrar movimiento de inventario
          await addDoc(collection(db, COLLECTIONS.INVENTORY_MOVEMENTS), {
            productId: item.productId,
            quantity: -item.quantity, // Negativo porque es una salida
            type: 'sale',
            referenceId: saleRef.id,
            note: `Venta #${saleRef.id}`,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
          });
        }
      }

      return { id: saleRef.id, ...newSale };
    } catch (error) {
      console.error('Error al registrar venta:', error);
      throw error;
    }
  };

  // Obtener ventas
  const getSales = async (startDate = null, endDate = null) => {
    try {
      let salesQuery = collection(db, COLLECTIONS.SALES);

      if (startDate && endDate) {
        salesQuery = query(
          salesQuery,
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        );
      }

      const snapshot = await getDocs(salesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error;
    }
  };

  const value = {
    products,
    categories,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    registerSale,
    getSales,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
