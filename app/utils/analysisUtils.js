import {
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  isSameDay,
  format,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Calcula la predicción de ventas para los próximos días basado en datos históricos
 * Utiliza un modelo simple de media móvil ponderada
 *
 * @param {Array} historicalSales - Array de objetos de ventas históricas
 * @param {number} daysToPredict - Número de días para predecir
 * @returns {Array} - Array de predicciones diarias
 */
export const predictSales = (historicalSales, daysToPredict = 30) => {
  if (!historicalSales || historicalSales.length === 0) {
    return [];
  }

  // Agrupar ventas por día
  const salesByDay = {};
  historicalSales.forEach(sale => {
    const saleDate =
      sale.createdAt instanceof Date
        ? sale.createdAt
        : new Date(sale.createdAt);
    const dateKey = format(saleDate, 'yyyy-MM-dd');

    if (!salesByDay[dateKey]) {
      salesByDay[dateKey] = {
        date: saleDate,
        total: 0,
        count: 0,
      };
    }

    salesByDay[dateKey].total += sale.total || 0;
    salesByDay[dateKey].count += 1;
  });

  // Convertir a array ordenado por fecha
  const dailySales = Object.values(salesByDay).sort((a, b) => a.date - b.date);

  // Si no hay suficientes datos para predecir, retornar datos existentes
  if (dailySales.length < 7) {
    return dailySales.map(day => ({
      date: day.date,
      predicted: false,
      total: day.total,
      count: day.count,
    }));
  }

  // Calcular predicciones usando media móvil ponderada
  const predictions = [];

  // Obtener la última fecha del histórico
  const lastDate = dailySales[dailySales.length - 1].date;

  // Preparar datos para usar media móvil ponderada (últimos 30 días)
  const recentSales = dailySales.slice(-30);

  // Calcular la media móvil para los últimos 30 días (dando más peso a los más recientes)
  const calculateWeightedAverage = () => {
    let weightSum = 0;
    let valueSum = 0;

    recentSales.forEach((sale, index) => {
      // El peso aumenta cuanto más reciente es la venta
      const weight = index + 1;
      weightSum += weight;
      valueSum += sale.total * weight;
    });

    return valueSum / weightSum;
  };

  // Calcular tendencia (porcentaje de cambio últimos 7 días vs 7 días anteriores)
  const calculateTrend = () => {
    if (recentSales.length < 14) return 1; // Sin cambio si no hay suficientes datos

    const lastWeek = recentSales.slice(-7);
    const previousWeek = recentSales.slice(-14, -7);

    const lastWeekTotal = lastWeek.reduce((sum, day) => sum + day.total, 0);
    const previousWeekTotal = previousWeek.reduce(
      (sum, day) => sum + day.total,
      0
    );

    if (previousWeekTotal === 0) return 1;

    return lastWeekTotal / previousWeekTotal;
  };

  const baseAverage = calculateWeightedAverage();
  const trend = calculateTrend();

  // Generar predicciones para los próximos días
  for (let i = 1; i <= daysToPredict; i++) {
    const predictionDate = addDays(lastDate, i);
    const dayOfWeek = predictionDate.getDay();

    // Factor de ajuste según el día de la semana (basado en patrones semanales)
    let dayFactor = 1;

    // Ajustar según el día de la semana (esto podría refinarse con datos reales)
    if (dayOfWeek === 0) dayFactor = 0.8; // Domingo
    if (dayOfWeek === 5 || dayOfWeek === 6) dayFactor = 1.2; // Viernes y Sábado

    // Aplicar factores a la predicción
    const predictedTotal = baseAverage * Math.pow(trend, i / 7) * dayFactor;

    predictions.push({
      date: predictionDate,
      predicted: true,
      total: Math.round(predictedTotal * 100) / 100,
      count: Math.round(
        (predictedTotal / baseAverage) *
          (recentSales.reduce((sum, day) => sum + day.count, 0) /
            recentSales.length)
      ),
    });
  }

  // Combinar datos históricos con predicciones
  return [
    ...dailySales.map(day => ({
      date: day.date,
      predicted: false,
      total: day.total,
      count: day.count,
    })),
    ...predictions,
  ];
};

/**
 * Identifica productos que necesitan reabastecimiento basado en tendencias de ventas
 *
 * @param {Array} products - Lista de productos en inventario
 * @param {Array} salesHistory - Historial de ventas
 * @param {number} threshold - Umbral para considerar bajo stock (días)
 * @returns {Array} - Productos recomendados para reabastecimiento
 */
export const getRestockRecommendations = (
  products,
  salesHistory,
  threshold = 14
) => {
  if (
    !products ||
    products.length === 0 ||
    !salesHistory ||
    salesHistory.length === 0
  ) {
    return [];
  }

  // Calcular tasa de venta diaria para cada producto
  const productSalesRate = {};

  // Obtener la fecha más antigua y más reciente en el historial de ventas
  const dates = salesHistory.map(sale =>
    sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt)
  );
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));

  // Calcular número de días en el período de análisis
  const daysDifference = Math.max(
    1,
    Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24))
  );

  // Calcular ventas totales por producto
  salesHistory.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        if (!productSalesRate[item.productId]) {
          productSalesRate[item.productId] = {
            totalSold: 0,
            lastSold: null,
            dailyRate: 0,
          };
        }

        productSalesRate[item.productId].totalSold += item.quantity || 0;

        const saleDate =
          sale.createdAt instanceof Date
            ? sale.createdAt
            : new Date(sale.createdAt);
        if (
          !productSalesRate[item.productId].lastSold ||
          saleDate > productSalesRate[item.productId].lastSold
        ) {
          productSalesRate[item.productId].lastSold = saleDate;
        }
      });
    }
  });

  // Calcular tasa diaria y proyectar días hasta agotamiento
  products.forEach(product => {
    if (productSalesRate[product.id]) {
      const rate = productSalesRate[product.id];
      rate.dailyRate = rate.totalSold / daysDifference;

      // Evitar división por cero
      if (rate.dailyRate > 0) {
        rate.daysUntilOutOfStock = Math.floor(
          product.quantity / rate.dailyRate
        );
      } else {
        rate.daysUntilOutOfStock = 999; // Valor alto para productos que no se venden
      }

      // Calcular cantidad recomendada para reordenar (para cubrir 30 días)
      rate.recommendedReorderQuantity = Math.ceil(rate.dailyRate * 30);
    }
  });

  // Filtrar productos que necesitan reabastecimiento pronto
  const recommendations = products
    .filter(product => {
      const rate = productSalesRate[product.id];
      // Incluir si tiene historial de ventas y está por debajo del umbral de días o ya está agotado
      return (
        rate && (rate.daysUntilOutOfStock <= threshold || product.quantity <= 0)
      );
    })
    .map(product => {
      const rate = productSalesRate[product.id];
      return {
        ...product,
        dailySalesRate: rate.dailyRate.toFixed(2),
        daysUntilOutOfStock: rate.daysUntilOutOfStock,
        recommendedQuantity: rate.recommendedReorderQuantity,
        lastSold: rate.lastSold,
        urgency:
          product.quantity <= 0
            ? 'high'
            : rate.daysUntilOutOfStock <= 7
            ? 'medium'
            : 'low',
      };
    })
    .sort((a, b) => a.daysUntilOutOfStock - b.daysUntilOutOfStock);

  return recommendations;
};

/**
 * Identifica productos más y menos vendidos
 *
 * @param {Array} products - Lista completa de productos
 * @param {Array} sales - Historial de ventas
 * @param {Object} options - Opciones de filtrado (periodo, categoría, etc)
 * @returns {Object} - Objeto con productos más y menos vendidos
 */
export const getProductPerformance = (products, sales, options = {}) => {
  if (!products || !sales || products.length === 0 || sales.length === 0) {
    return {
      topSelling: [],
      worstSelling: [],
      profitable: [],
      unprofitable: [],
    };
  }

  const { period = 30, categoryId = null } = options;

  // Filtrar ventas por período (últimos X días)
  const cutoffDate = subDays(new Date(), period);
  const filteredSales = sales.filter(sale => {
    const saleDate =
      sale.createdAt instanceof Date
        ? sale.createdAt
        : new Date(sale.createdAt);
    return saleDate >= cutoffDate;
  });

  // Acumular datos de ventas por producto
  const productPerformance = {};

  // Inicializar todos los productos para incluir también los que no tienen ventas
  products.forEach(product => {
    // Filtrar por categoría si se especifica
    if (categoryId && product.category !== categoryId) {
      return;
    }

    productPerformance[product.id] = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      cost: product.cost,
      currentStock: product.quantity,
      quantitySold: 0,
      revenue: 0,
      profit: 0,
      profitMargin: 0,
      turnoverRate: 0,
    };
  });

  // Acumular ventas
  filteredSales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        if (productPerformance[item.productId]) {
          const performance = productPerformance[item.productId];
          performance.quantitySold += item.quantity || 0;
          performance.revenue += (item.price || 0) * (item.quantity || 0);

          // Calcular ganancia usando el costo del producto
          const product = products.find(p => p.id === item.productId);
          if (product) {
            performance.profit +=
              ((item.price || 0) - (product.cost || 0)) * (item.quantity || 0);
          }
        }
      });
    }
  });

  // Calcular métricas adicionales
  Object.values(productPerformance).forEach(performance => {
    // Margen de beneficio (%)
    if (performance.revenue > 0) {
      performance.profitMargin =
        (performance.profit / performance.revenue) * 100;
    }

    // Tasa de rotación (ventas / stock actual + ventas)
    const totalQuantity = performance.currentStock + performance.quantitySold;
    if (totalQuantity > 0) {
      performance.turnoverRate =
        (performance.quantitySold / totalQuantity) * 100;
    }
  });

  // Convertir a array para ordenación
  const performanceArray = Object.values(productPerformance);

  // Ordenar por diferentes criterios
  const topSelling = [...performanceArray]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10);

  const worstSelling = [...performanceArray]
    .filter(p => p.currentStock > 0) // Solo considerar productos con stock
    .sort((a, b) => a.quantitySold - b.quantitySold)
    .slice(0, 10);

  const profitable = [...performanceArray]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  const unprofitable = [...performanceArray]
    .filter(p => p.quantitySold > 0) // Solo considerar productos con ventas
    .sort((a, b) => a.profitMargin - b.profitMargin)
    .slice(0, 10);

  // Calcular estadísticas generales
  const totalRevenue = performanceArray.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalProfit = performanceArray.reduce(
    (sum, item) => sum + item.profit,
    0
  );
  const totalQuantitySold = performanceArray.reduce(
    (sum, item) => sum + item.quantitySold,
    0
  );

  // Calcular contribución a ventas y beneficio de cada producto
  topSelling.forEach(product => {
    product.contributionToSales =
      totalQuantitySold > 0
        ? (product.quantitySold / totalQuantitySold) * 100
        : 0;
    product.contributionToRevenue =
      totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
    product.contributionToProfit =
      totalProfit > 0 ? (product.profit / totalProfit) * 100 : 0;
  });

  return {
    topSelling,
    worstSelling,
    profitable,
    unprofitable,
    summary: {
      totalRevenue,
      totalProfit,
      totalQuantitySold,
      averageProfitMargin:
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    },
  };
};

/**
 * Analiza patrones de ventas estacionales
 *
 * @param {Array} sales - Historial de ventas
 * @returns {Object} - Patrones de ventas por mes, día de la semana, etc.
 */
export const analyzeSeasonalPatterns = sales => {
  if (!sales || sales.length === 0) {
    return {
      byMonth: [],
      byDayOfWeek: [],
      byHourOfDay: [],
    };
  }

  // Inicializar contadores
  const byMonth = Array(12)
    .fill(0)
    .map((_, i) => ({
      month: i,
      monthName: format(new Date(2021, i, 1), 'MMMM', { locale: es }),
      count: 0,
      total: 0,
    }));

  const byDayOfWeek = Array(7)
    .fill(0)
    .map((_, i) => ({
      day: i,
      dayName: format(new Date(2021, 0, 3 + i), 'EEEE', { locale: es }),
      count: 0,
      total: 0,
    }));

  const byHourOfDay = Array(24)
    .fill(0)
    .map((_, i) => ({
      hour: i,
      count: 0,
      total: 0,
    }));

  // Procesar ventas
  sales.forEach(sale => {
    const saleDate =
      sale.createdAt instanceof Date
        ? sale.createdAt
        : new Date(sale.createdAt);
    const month = saleDate.getMonth();
    const dayOfWeek = saleDate.getDay();
    const hour = saleDate.getHours();
    const total = sale.total || 0;

    // Acumular por mes
    byMonth[month].count += 1;
    byMonth[month].total += total;

    // Acumular por día de la semana
    byDayOfWeek[dayOfWeek].count += 1;
    byDayOfWeek[dayOfWeek].total += total;

    // Acumular por hora del día
    byHourOfDay[hour].count += 1;
    byHourOfDay[hour].total += total;
  });

  // Calcular promedios
  byMonth.forEach(month => {
    month.average = month.count > 0 ? month.total / month.count : 0;
  });

  byDayOfWeek.forEach(day => {
    day.average = day.count > 0 ? day.total / day.count : 0;
  });

  byHourOfDay.forEach(hour => {
    hour.average = hour.count > 0 ? hour.total / hour.count : 0;
  });

  // Identificar picos
  const maxMonth = Math.max(...byMonth.map(m => m.total));
  const maxDay = Math.max(...byDayOfWeek.map(d => d.total));
  const maxHour = Math.max(...byHourOfDay.map(h => h.total));

  byMonth.forEach(month => {
    month.isHighSeason = month.total > maxMonth * 0.7;
    month.isLowSeason = month.total < maxMonth * 0.3;
  });

  byDayOfWeek.forEach(day => {
    day.isPeak = day.total > maxDay * 0.7;
    day.isSlow = day.total < maxDay * 0.3;
  });

  byHourOfDay.forEach(hour => {
    hour.isPeak = hour.total > maxHour * 0.7;
    hour.isSlow = hour.total < maxHour * 0.3;
  });

  // Recomendar horarios de mayor personal basado en picos
  const peakHours = byHourOfDay
    .filter(hour => hour.isPeak)
    .map(hour => hour.hour);

  const peakDays = byDayOfWeek.filter(day => day.isPeak).map(day => day.day);

  return {
    byMonth,
    byDayOfWeek,
    byHourOfDay,
    recommendations: {
      highSeasonMonths: byMonth
        .filter(m => m.isHighSeason)
        .map(m => m.monthName),
      peakDays: byDayOfWeek.filter(d => d.isPeak).map(d => d.dayName),
      peakHours: peakHours.map(h => `${h}:00 - ${h + 1}:00`),
      staffingRecommendation: `Mayor personal recomendado los ${peakDays
        .map(d => byDayOfWeek[d].dayName)
        .join(', ')} entre ${peakHours.map(h => `${h}:00`).join(' y ')} horas.`,
    },
  };
};
