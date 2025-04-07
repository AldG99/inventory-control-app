import { useState, useContext } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../services/firebaseService';
import { AuthContext } from '../context/AuthContext';
import COLLECTIONS from '../constants/collections';

export const useSales = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registrar una nueva venta
  const registerSale = async saleData => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      setLoading(true);

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
            note: `Venta #${saleRef.id.slice(-6)}`,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
          });
        }
      }

      return { id: saleRef.id, ...newSale };
    } catch (err) {
      console.error('Error al registrar venta:', err);
      setError('Error al registrar la venta. Por favor, inténtalo de nuevo.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener ventas
  const getSales = async (options = {}) => {
    try {
      setLoading(true);

      let salesQuery = collection(db, COLLECTIONS.SALES);
      let queryFilters = [];

      // Añadir filtros de fecha
      if (options.startDate) {
        queryFilters.push(where('createdAt', '>=', options.startDate));
      }

      if (options.endDate) {
        queryFilters.push(where('createdAt', '<=', options.endDate));
      }

      // Ordenar por fecha (más reciente primero)
      queryFilters.push(orderBy('createdAt', 'desc'));

      // Aplicar los filtros
      salesQuery = query(salesQuery, ...queryFilters);

      const snapshot = await getDocs(salesQuery);

      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return salesData;
    } catch (err) {
      console.error('Error al obtener ventas:', err);
      setError('Error al cargar las ventas. Por favor, inténtalo de nuevo.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener detalle de una venta
  const getSaleById = async saleId => {
    try {
      setLoading(true);

      const saleDoc = await getDoc(doc(db, COLLECTIONS.SALES, saleId));

      if (!saleDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const saleData = {
        id: saleDoc.id,
        ...saleDoc.data(),
        createdAt: saleDoc.data().createdAt?.toDate(),
      };

      return saleData;
    } catch (err) {
      console.error('Error al obtener detalle de venta:', err);
      setError(
        'Error al cargar el detalle de la venta. Por favor, inténtalo de nuevo.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas de ventas
  const getSalesStats = async (options = {}) => {
    try {
      // Obtener ventas según los filtros
      const sales = await getSales(options);

      if (sales.length === 0) {
        return {
          totalSales: 0,
          totalRevenue: 0,
          totalItemsSold: 0,
          averageSaleValue: 0,
          salesByPaymentMethod: {},
          topSellingProducts: [],
        };
      }

      // Calcular estadísticas básicas
      const totalSales = sales.length;
      const totalRevenue = sales.reduce(
        (sum, sale) => sum + (sale.total || 0),
        0
      );
      const averageSaleValue = totalRevenue / totalSales;

      // Contar productos vendidos y agrupar por producto
      let productSales = {};
      let totalItemsSold = 0;

      sales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            totalItemsSold += item.quantity || 0;

            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                productId: item.productId,
                productName: item.productName,
                quantity: 0,
                revenue: 0,
              };
            }

            productSales[item.productId].quantity += item.quantity || 0;
            productSales[item.productId].revenue +=
              (item.price || 0) * (item.quantity || 0);
          });
        }
      });

      // Convertir a array y ordenar por cantidad
      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5); // Top 5

      // Ventas agrupadas por método de pago
      const salesByPaymentMethod = sales.reduce((acc, sale) => {
        const method = sale.paymentMethod || 'Efectivo';
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 };
        }
        acc[method].count += 1;
        acc[method].total += sale.total || 0;
        return acc;
      }, {});

      return {
        totalSales,
        totalRevenue,
        totalItemsSold,
        averageSaleValue,
        salesByPaymentMethod,
        topSellingProducts,
      };
    } catch (err) {
      console.error('Error al obtener estadísticas de ventas:', err);
      setError(
        'Error al cargar estadísticas de ventas. Por favor, inténtalo de nuevo.'
      );
      throw err;
    }
  };

  return {
    loading,
    error,
    registerSale,
    getSales,
    getSaleById,
    getSalesStats,
  };
};

export default useSales;
