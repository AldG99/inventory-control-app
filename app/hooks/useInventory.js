import { useState, useEffect, useContext } from 'react';
import {
 collection,
 doc,
 addDoc,
 updateDoc,
 deleteDoc,
 onSnapshot,
 query,
 where,
 getDocs,
 serverTimestamp,
 getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebaseService';
import { AuthContext } from '../context/AuthContext';
import COLLECTIONS from '../constants/collections';

export const useInventory = () => {
 const { user } = useContext(AuthContext);
 const [products, setProducts] = useState([]);
 const [categories, setCategories] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 // Cargar productos y categorías cuando el componente se monta
 useEffect(() => {
 if (!user) {
 setProducts([]);
 setCategories([]);
 setLoading(false);
 return;
 }

 setLoading(true);
 setError(null);

 // Suscripción a cambios en la colección de productos
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
 err => {
 console.error('Error al cargar productos:', err);
 setError('Error al cargar productos. Por favor, inténtalo de nuevo.');
 setLoading(false);
 }
 );

 // Suscripción a cambios en la colección de categorías
 const unsubscribeCategories = onSnapshot(
 collection(db, COLLECTIONS.CATEGORIES),
 snapshot => {
 const categoriesData = snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data(),
 }));
 setCategories(categoriesData);
 },
 err => {
 console.error('Error al cargar categorías:', err);
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
 } catch (err) {
 console.error('Error al añadir producto:', err);
 throw err;
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
 } catch (err) {
 console.error('Error al actualizar producto:', err);
 throw err;
 }
 };

 // Eliminar un producto
 const deleteProduct = async productId => {
 try {
 await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
 return productId;
 } catch (err) {
 console.error('Error al eliminar producto:', err);
 throw err;
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
 } catch (err) {
 console.error('Error al añadir categoría:', err);
 throw err;
 }
 };

 // Obtener productos por categoría
 const getProductsByCategory = async categoryId => {
 try {
 const q = query(
 collection(db, COLLECTIONS.PRODUCTS),
 where('category', '==', categoryId)
 );
 const snapshot = await getDocs(q);
 return snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data(),
 }));
 } catch (err) {
 console.error('Error al obtener productos por categoría:', err);
 throw err;
 }
 };

 // Buscar productos
 const searchProducts = searchTerm => {
 if (!searchTerm) return [...products];

 const term = searchTerm.toLowerCase();
 return products.filter(
 product =>
 product.name?.toLowerCase().includes(term) ||
 product.sku?.toLowerCase().includes(term) ||
 product.description?.toLowerCase().includes(term)
 );
 };

 // Obtener productos con bajo stock
 const getLowStockProducts = (threshold = 5) => {
 return products.filter(
 product => product.quantity <= threshold && product.quantity > 0
 );
 };

 // Obtener productos sin stock
 const getOutOfStockProducts = () => {
 return products.filter(product => product.quantity <= 0);
 };

 return {
 products,
 categories,
 loading,
 error,
 addProduct,
 updateProduct,
 deleteProduct,
 addCategory,
 getProductsByCategory,
 searchProducts,
 getLowStockProducts,
 getOutOfStockProducts,
 };
};

export default useInventory;
