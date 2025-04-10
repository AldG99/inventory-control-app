import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import {
  predictSales,
  getRestockRecommendations,
  getProductPerformance,
  analyzeSeasonalPatterns,
} from '../utils/analysisUtils';

const useAnalytics = () => {
  const { user } = useContext(AuthContext);
  const { products } = useContext(InventoryContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para almacenar los resultados de análisis
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesPrediction, setSalesPrediction] = useState([]);
  const [restockRecommendations, setRestockRecommendations] = useState([]);
  const [productPerformance, setProductPerformance] = useState(null);
  const [seasonalPatterns, setSeasonalPatterns] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(90); // 90 días por defecto
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Cargar historial de ventas
  const loadSalesHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular fecha de inicio según el período seleccionado
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - selectedPeriod);

      // Consultar ventas en el período seleccionado
      const salesQuery = query(
        collection(db, COLLECTIONS.SALES),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(salesQuery);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
      }));

      setSalesHistory(salesData);

      // Generar análisis con los datos obtenidos
      analyzeData(salesData, products);
    } catch (err) {
      console.error('Error al cargar historial de ventas:', err);
      setError(
        'Error al cargar datos de ventas. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Generar todos los análisis con los datos actualizados
  const analyzeData = (sales, products) => {
    if (!sales || !products) return;

    try {
      // Predicción de ventas
      const predictions = predictSales(sales, 30); // 30 días de predicción
      setSalesPrediction(predictions);

      // Recomendaciones de reabastecimiento
      const restock = getRestockRecommendations(products, sales, 14); // Umbral de 14 días
      setRestockRecommendations(restock);

      // Análisis de rendimiento de productos
      const performance = getProductPerformance(products, sales, {
        period: selectedPeriod,
        categoryId: selectedCategory,
      });
      setProductPerformance(performance);

      // Patrones estacionales
      const patterns = analyzeSeasonalPatterns(sales);
      setSeasonalPatterns(patterns);
    } catch (err) {
      console.error('Error al analizar datos:', err);
      setError('Error al generar análisis avanzado.');
    }
  };

  // Actualizar análisis cuando cambian los productos o el período seleccionado
  useEffect(() => {
    if (salesHistory.length > 0 && products.length > 0) {
      analyzeData(salesHistory, products);
    }
  }, [products, selectedPeriod, selectedCategory]);

  // Cargar datos al montar el componente o cuando cambie el usuario o período
  useEffect(() => {
    if (user) {
      loadSalesHistory();
    }
  }, [user, selectedPeriod]);

  // Función para cambiar el período de análisis
  const changePeriod = period => {
    setSelectedPeriod(period);
  };

  // Función para filtrar por categoría
  const filterByCategory = categoryId => {
    setSelectedCategory(categoryId);
  };

  // Función para actualizar manualmente los datos
  const refreshData = () => {
    loadSalesHistory();
  };

  return {
    loading,
    error,
    salesHistory,
    salesPrediction,
    restockRecommendations,
    productPerformance,
    seasonalPatterns,
    selectedPeriod,
    selectedCategory,
    changePeriod,
    filterByCategory,
    refreshData,
  };
};

export default useAnalytics;
