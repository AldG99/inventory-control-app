import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';
import colors from '../constants/colors';

const ReportsScreen = ({ navigation }) => {
  const { products } = useContext(InventoryContext);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [periodFilter, setPeriodFilter] = useState('week'); // 'day', 'week', 'month', 'year'

  // Estadísticas de inventario
  const totalProducts = products.length;
  const totalItems = products.reduce(
    (sum, product) => sum + (product.quantity || 0),
    0
  );
  const lowStockProducts = products.filter(
    product => product.quantity <= 5
  ).length;
  const outOfStockProducts = products.filter(
    product => product.quantity <= 0
  ).length;

  // Calcular el valor total del inventario (precio * cantidad)
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
    0
  );

  // Cargar datos de ventas según el filtro de periodo
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);

        // Calcular fecha de inicio según el filtro
        const startDate = new Date();
        if (periodFilter === 'day') {
          startDate.setHours(0, 0, 0, 0); // Inicio del día actual
        } else if (periodFilter === 'week') {
          startDate.setDate(startDate.getDate() - 7); // 7 días atrás
        } else if (periodFilter === 'month') {
          startDate.setMonth(startDate.getMonth() - 1); // 1 mes atrás
        } else if (periodFilter === 'year') {
          startDate.setFullYear(startDate.getFullYear() - 1); // 1 año atrás
        }

        // Consultar ventas en el periodo seleccionado
        const salesQuery = query(
          collection(db, COLLECTIONS.SALES),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(salesQuery);
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
        }));

        setSalesData(salesData);
      } catch (error) {
        console.error('Error al cargar datos de ventas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [periodFilter]);

  // Calcular estadísticas de ventas
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );
  const totalItemsSold = salesData.reduce((sum, sale) => {
    return (
      sum +
      (sale.items?.reduce(
        (itemSum, item) => itemSum + (item.quantity || 0),
        0
      ) || 0)
    );
  }, 0);

  // Ventas agrupadas por método de pago
  const salesByPaymentMethod = salesData.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'Efectivo';
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += sale.total || 0;
    return acc;
  }, {});

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Obtener título del periodo
  const getPeriodTitle = () => {
    switch (periodFilter) {
      case 'day':
        return 'Hoy';
      case 'week':
        return 'Últimos 7 días';
      case 'month':
        return 'Último mes';
      case 'year':
        return 'Último año';
      default:
        return 'Últimos 7 días';
    }
  };

  // Función para navegar a análisis avanzados
  const goToAdvancedAnalytics = () => {
    navigation.navigate('Analytics');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reportes y Estadísticas</Text>
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={goToAdvancedAnalytics}
          >
            <Ionicons name="analytics" size={wp(5)} color={colors.white} />
            <Text style={styles.analyticsButtonText}>Análisis Avanzado</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Filtro de periodo */}
          <View style={styles.periodFilter}>
            <Text style={styles.periodTitle}>Periodo: {getPeriodTitle()}</Text>
            <View style={styles.periodOptions}>
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  periodFilter === 'day' && styles.selectedPeriodOption,
                ]}
                onPress={() => setPeriodFilter('day')}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    periodFilter === 'day' && styles.selectedPeriodOptionText,
                  ]}
                >
                  Día
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodOption,
                  periodFilter === 'week' && styles.selectedPeriodOption,
                ]}
                onPress={() => setPeriodFilter('week')}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    periodFilter === 'week' && styles.selectedPeriodOptionText,
                  ]}
                >
                  Semana
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodOption,
                  periodFilter === 'month' && styles.selectedPeriodOption,
                ]}
                onPress={() => setPeriodFilter('month')}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    periodFilter === 'month' && styles.selectedPeriodOptionText,
                  ]}
                >
                  Mes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodOption,
                  periodFilter === 'year' && styles.selectedPeriodOption,
                ]}
                onPress={() => setPeriodFilter('year')}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    periodFilter === 'year' && styles.selectedPeriodOptionText,
                  ]}
                >
                  Año
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando datos...</Text>
            </View>
          ) : (
            <>
              {/* Resumen de Ventas */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Resumen de Ventas</Text>
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() =>
                      navigation.navigate('Sales', { screen: 'SalesHistory' })
                    }
                  >
                    <Text style={styles.viewMoreText}>Ver historial</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={wp(4)}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name="cart-outline"
                      size={wp(7)}
                      color={colors.white}
                    />
                    <Text style={styles.statValue}>{totalSales}</Text>
                    <Text style={styles.statLabel}>Ventas</Text>
                  </View>

                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.success },
                    ]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={wp(7)}
                      color={colors.white}
                    />
                    <Text style={styles.statValue}>
                      {formatCurrency(totalRevenue)}
                    </Text>
                    <Text style={styles.statLabel}>Ingresos</Text>
                  </View>

                  <View
                    style={[styles.statCard, { backgroundColor: colors.info }]}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={wp(7)}
                      color={colors.white}
                    />
                    <Text style={styles.statValue}>{totalItemsSold}</Text>
                    <Text style={styles.statLabel}>Productos vendidos</Text>
                  </View>
                </View>

                {/* Ventas por método de pago */}
                <View style={styles.paymentMethodsContainer}>
                  <Text style={styles.subsectionTitle}>Por Método de Pago</Text>

                  {Object.keys(salesByPaymentMethod).length > 0 ? (
                    Object.entries(salesByPaymentMethod).map(
                      ([method, data]) => (
                        <View key={method} style={styles.paymentMethodItem}>
                          <View style={styles.paymentMethodInfo}>
                            <Ionicons
                              name={
                                method === 'Efectivo'
                                  ? 'cash-outline'
                                  : method === 'Tarjeta'
                                  ? 'card-outline'
                                  : 'repeat-outline'
                              }
                              size={wp(5)}
                              color={colors.textLight}
                            />
                            <Text style={styles.paymentMethodName}>
                              {method}
                            </Text>
                          </View>
                          <Text style={styles.paymentMethodCount}>
                            {data.count} ventas
                          </Text>
                          <Text style={styles.paymentMethodTotal}>
                            {formatCurrency(data.total)}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text style={styles.noDataText}>
                      No hay ventas en este periodo
                    </Text>
                  )}
                </View>
              </View>

              {/* Resumen de Inventario */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Resumen de Inventario</Text>
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => navigation.navigate('Inventory')}
                  >
                    <Text style={styles.viewMoreText}>Ver inventario</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={wp(4)}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={wp(7)}
                      color={colors.white}
                    />
                    <Text style={styles.statValue}>{totalProducts}</Text>
                    <Text style={styles.statLabel}>Productos</Text>
                  </View>

                  <View
                    style={[styles.statCard, { backgroundColor: colors.info }]}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={wp(7)}
                      color={colors.white}
                    />
                    <Text style={styles.statValue}>{totalItems}</Text>
                    <Text style={styles.statLabel}>Unidades</Text>
                  </View>

                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.success },
                    ]}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={wp(7)}
                      color={colors.white}
                    />
                    <Text style={styles.statValue}>
                      {formatCurrency(inventoryValue)}
                    </Text>
                    <Text style={styles.statLabel}>Valor</Text>
                  </View>
                </View>

                <View style={styles.inventoryStatusContainer}>
                  <Text style={styles.subsectionTitle}>
                    Estado del Inventario
                  </Text>

                  <View style={styles.inventoryStatusItem}>
                    <View style={styles.statusInfo}>
                      <View
                        style={[
                          styles.statusIndicator,
                          styles.lowStockIndicator,
                        ]}
                      />
                      <Text style={styles.statusName}>Stock Bajo</Text>
                    </View>
                    <Text style={styles.statusCount}>
                      {lowStockProducts} productos
                    </Text>
                  </View>

                  <View style={styles.inventoryStatusItem}>
                    <View style={styles.statusInfo}>
                      <View
                        style={[
                          styles.statusIndicator,
                          styles.outOfStockIndicator,
                        ]}
                      />
                      <Text style={styles.statusName}>Agotados</Text>
                    </View>
                    <Text style={styles.statusCount}>
                      {outOfStockProducts} productos
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sección de recomendaciones */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recomendaciones</Text>

                <View style={styles.recommendationCard}>
                  <View style={styles.recommendationIcon}>
                    <Ionicons
                      name="trending-up"
                      size={wp(6)}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>
                      Análisis Avanzado
                    </Text>
                    <Text style={styles.recommendationText}>
                      Obtén predicciones de ventas y descubre patrones en tu
                      negocio
                    </Text>
                    <TouchableOpacity
                      style={styles.recommendationButton}
                      onPress={goToAdvancedAnalytics}
                    >
                      <Text style={styles.recommendationButtonText}>
                        Ver análisis
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {lowStockProducts > 0 && (
                  <View style={styles.recommendationCard}>
                    <View
                      style={[
                        styles.recommendationIcon,
                        { backgroundColor: colors.warning },
                      ]}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={wp(6)}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationTitle}>
                        Productos con Bajo Stock
                      </Text>
                      <Text style={styles.recommendationText}>
                        Tienes {lowStockProducts} productos con poco inventario
                        que deberías reabastecer pronto
                      </Text>
                      <TouchableOpacity
                        style={styles.recommendationButton}
                        onPress={() => navigation.navigate('Inventory')}
                      >
                        <Text style={styles.recommendationButtonText}>
                          Ver productos
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: dimensions.borderRadiusMedium,
  },
  analyticsButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: wp(1),
    fontSize: wp(3.5),
  },
  content: {
    flex: 1,
    padding: wp(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(30),
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: wp(4),
    color: colors.textLight,
  },
  periodFilter: {
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
  periodTitle: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(1.5),
  },
  periodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodOption: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: wp(0.5),
    borderRadius: dimensions.borderRadiusSmall,
  },
  selectedPeriodOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodOptionText: {
    fontSize: wp(3.5),
    color: colors.text,
  },
  selectedPeriodOptionText: {
    color: colors.white,
    fontWeight: '500',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: wp(3.5),
    color: colors.primary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: hp(2.5),
  },
  statCard: {
    width: wp(isTablet() ? 28 : 28),
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  statValue: {
    fontSize: isTablet() ? wp(4) : wp(4.5),
    fontWeight: 'bold',
    color: colors.white,
    marginVertical: hp(0.8),
    textAlign: 'center',
  },
  statLabel: {
    fontSize: wp(3.2),
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(1.5),
  },
  paymentMethodsContainer: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodName: {
    marginLeft: wp(2),
    fontSize: wp(3.8),
    color: colors.text,
  },
  paymentMethodCount: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginRight: wp(3),
  },
  paymentMethodTotal: {
    fontSize: wp(3.8),
    fontWeight: 'bold',
    color: colors.text,
    minWidth: wp(20),
    textAlign: 'right',
  },
  inventoryStatusContainer: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
  },
  inventoryStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginRight: wp(2),
  },
  lowStockIndicator: {
    backgroundColor: colors.warning,
  },
  outOfStockIndicator: {
    backgroundColor: colors.danger,
  },
  statusName: {
    fontSize: wp(3.8),
    color: colors.text,
  },
  statusCount: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: colors.textLight,
  },
  noDataText: {
    fontSize: wp(3.8),
    color: colors.textLight,
    textAlign: 'center',
    padding: hp(2),
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    borderWidth: 1,
    borderColor: colors.border,
    padding: wp(3),
    marginBottom: hp(1.5),
  },
  recommendationIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  recommendationText: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(1),
  },
  recommendationButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight + '20',
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3),
    borderRadius: dimensions.borderRadiusSmall,
  },
  recommendationButtonText: {
    fontSize: wp(3.5),
    color: colors.primary,
    fontWeight: '500',
  },
});

export default ReportsScreen;
