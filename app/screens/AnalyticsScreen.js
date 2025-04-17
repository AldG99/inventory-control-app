import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import useAnalytics from '../hooks/useAnalytics';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';
import colors from '../constants/colors';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

const AnalyticsScreen = () => {
  const {
    loading,
    error,
    salesPrediction,
    restockRecommendations,
    productPerformance,
    seasonalPatterns,
    selectedPeriod,
    changePeriod,
    filterByCategory,
    refreshData,
  } = useAnalytics();

  const [activeTab, setActiveTab] = useState('predictions');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChart, setSelectedChart] = useState('sales'); // 'sales' o 'profit'

  // Manejar pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Preparar datos para los gráficos
  const getSalesPredictionChartData = () => {
    if (!salesPrediction || salesPrediction.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    // Obtener hasta 14 días para mostrar (7 pasados + 7 futuros)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historicalData = salesPrediction
      .filter(item => !item.predicted && isAfter(today, item.date))
      .slice(-7);

    const predictedData = salesPrediction
      .filter(item => item.predicted)
      .slice(0, 7);

    const chartData = [...historicalData, ...predictedData];

    return {
      labels: chartData.map(item => format(item.date, 'dd/MM')),
      datasets: [
        {
          data: chartData.map(item => item.total),
          color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`, // Usar color primario
          strokeWidth: 2,
        },
      ],
    };
  };

  const getSeasonalChartData = () => {
    if (!seasonalPatterns) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    const { byDayOfWeek } = seasonalPatterns;

    return {
      labels: byDayOfWeek.map(day => day.dayName.substring(0, 3)),
      datasets: [
        {
          data: byDayOfWeek.map(day => day.total),
        },
      ],
    };
  };

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generando análisis avanzado...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={wp(12)}
            color={colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'predictions':
        return renderPredictionsTab();
      case 'restock':
        return renderRestockTab();
      case 'performance':
        return renderPerformanceTab();
      case 'seasonal':
        return renderSeasonalTab();
      default:
        return renderPredictionsTab();
    }
  };

  // Pestaña de predicciones de ventas
  const renderPredictionsTab = () => {
    const chartData = getSalesPredictionChartData();

    // Calcular totales para predicciones
    const getTotalPredictions = () => {
      if (!salesPrediction || salesPrediction.length === 0) return 0;

      return salesPrediction
        .filter(item => item.predicted)
        .reduce((sum, item) => sum + item.total, 0);
    };

    const predictedTotal = getTotalPredictions();

    // Se puede mantener como ScrollView ya que no contiene FlatList
    return (
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            Tendencia de Ventas (Próximos 7 días)
          </Text>

          {chartData.labels.length > 0 ? (
            <LineChart
              data={chartData}
              width={isTablet() ? wp(90) : wp(92)}
              height={hp(25)}
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(45, 55, 72, ${opacity})`,
                style: {
                  borderRadius: dimensions.borderRadiusMedium,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: hp(1),
                borderRadius: dimensions.borderRadiusMedium,
              }}
            />
          ) : (
            <View style={styles.noDataChart}>
              <Text style={styles.noDataText}>
                No hay suficientes datos para generar predicciones.
              </Text>
            </View>
          )}

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: colors.success },
                ]}
              />
              <Text style={styles.legendText}>Datos históricos</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={styles.legendText}>Predicción</Text>
            </View>
          </View>
        </View>

        <View style={styles.predictionSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ventas Previstas</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(predictedTotal)}
            </Text>
            <Text style={styles.summarySubtitle}>Próximos 7 días</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ventas Diarias</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(predictedTotal / 7)}
            </Text>
            <Text style={styles.summarySubtitle}>Promedio proyectado</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons
            name="information-circle-outline"
            size={wp(6)}
            color={colors.textLight}
          />
          <Text style={styles.infoText}>
            Las predicciones se basan en el historial de ventas y patrones
            identificados. Actualice regularmente para mejorar la precisión.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Pestaña de recomendaciones de reabastecimiento
  const renderRestockTab = () => {
    if (!restockRecommendations || restockRecommendations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={wp(15)}
            color={colors.success}
          />
          <Text style={styles.emptyTitle}>Inventario Saludable</Text>
          <Text style={styles.emptyText}>
            No hay productos que necesiten reabastecimiento urgente.
          </Text>
        </View>
      );
    }

    // Componente de encabezado para la FlatList
    const RestockHeader = () => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Recomendaciones de Reabastecimiento
        </Text>
        <Text style={styles.sectionSubtitle}>
          Basado en la tasa de venta y stock actual
        </Text>
      </View>
    );

    // Componente de pie para la FlatList
    const RestockFooter = () => (
      <View style={styles.infoContainer}>
        <Ionicons
          name="information-circle-outline"
          size={wp(6)}
          color={colors.textLight}
        />
        <Text style={styles.infoText}>
          Las recomendaciones se calculan considerando el historial de ventas de
          los últimos {selectedPeriod} días.
        </Text>
      </View>
    );

    return (
      <FlatList
        contentContainerStyle={styles.tabContent}
        data={restockRecommendations}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={<RestockHeader />}
        ListFooterComponent={<RestockFooter />}
        renderItem={({ item }) => (
          <View
            style={[
              styles.restockItem,
              item.urgency === 'high'
                ? styles.highUrgency
                : item.urgency === 'medium'
                ? styles.mediumUrgency
                : styles.lowUrgency,
            ]}
          >
            <View style={styles.restockInfo}>
              <Text style={styles.restockName}>{item.name}</Text>
              <Text style={styles.restockSku}>SKU: {item.sku || 'N/A'}</Text>
              <View style={styles.restockMetrics}>
                <Text style={styles.metricLabel}>Stock actual:</Text>
                <Text style={styles.metricValue}>{item.quantity} unidades</Text>
              </View>
              <View style={styles.restockMetrics}>
                <Text style={styles.metricLabel}>Ventas diarias:</Text>
                <Text style={styles.metricValue}>
                  {item.dailySalesRate} unid/día
                </Text>
              </View>
            </View>

            <View style={styles.restockAction}>
              <Text style={styles.daysUntilOutLabel}>
                {item.daysUntilOutOfStock <= 0
                  ? 'Agotado'
                  : `${item.daysUntilOutOfStock} días\nhasta agotarse`}
              </Text>
              <Text style={styles.recommendedQuantity}>
                Reordenar: {item.recommendedQuantity} unid
              </Text>
            </View>
          </View>
        )}
      />
    );
  };

  // Pestaña de rendimiento de productos
  const renderPerformanceTab = () => {
    if (!productPerformance) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>
            Cargando análisis de productos...
          </Text>
        </View>
      );
    }

    const { topSelling, worstSelling, profitable, unprofitable, summary } =
      productPerformance;

    // Renderizar tarjetas de selector
    const renderPerformanceSelector = () => {
      return (
        <View style={styles.performanceSelector}>
          <TouchableOpacity
            style={[
              styles.selectorOption,
              selectedChart === 'sales' && styles.selectorOptionActive,
            ]}
            onPress={() => setSelectedChart('sales')}
          >
            <Ionicons
              name="cart-outline"
              size={wp(6)}
              color={
                selectedChart === 'sales' ? colors.primary : colors.textLight
              }
            />
            <Text
              style={[
                styles.selectorText,
                selectedChart === 'sales' && styles.selectorTextActive,
              ]}
            >
              Ventas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorOption,
              selectedChart === 'profit' && styles.selectorOptionActive,
            ]}
            onPress={() => setSelectedChart('profit')}
          >
            <Ionicons
              name="cash-outline"
              size={wp(6)}
              color={
                selectedChart === 'profit' ? colors.primary : colors.textLight
              }
            />
            <Text
              style={[
                styles.selectorText,
                selectedChart === 'profit' && styles.selectorTextActive,
              ]}
            >
              Rentabilidad
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    // Creamos un componente para el header
    const PerformanceHeader = () => (
      <>
        {renderPerformanceSelector()}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ventas Totales</Text>
            <Text style={styles.summaryValue}>
              {summary.totalQuantitySold} unid.
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ingresos</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalRevenue)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Beneficio</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalProfit)}
            </Text>
          </View>
        </View>
      </>
    );

    // Solución: Usamos un componente con dos FlatLists separadas
    return (
      <FlatList
        data={[{ id: 'performance_section' }]} // Single item lista ficticia
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={() => (
          <View style={styles.tabContent}>
            <PerformanceHeader />

            <View style={styles.performanceSection}>
              <Text style={styles.performanceTitle}>
                {selectedChart === 'sales'
                  ? 'Productos Más Vendidos'
                  : 'Productos Más Rentables'}
              </Text>

              <FlatList
                data={selectedChart === 'sales' ? topSelling : profitable}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.performanceCard}>
                    <Text style={styles.performanceCardTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.performanceCardValue}>
                      {selectedChart === 'sales'
                        ? `${item.quantitySold} unid.`
                        : `${formatCurrency(item.profit)}`}
                    </Text>
                    <Text style={styles.performanceCardSubtitle}>
                      {selectedChart === 'sales'
                        ? `${item.contributionToSales.toFixed(1)}% del total`
                        : `Margen: ${item.profitMargin.toFixed(1)}%`}
                    </Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.performanceSection}>
              <Text style={styles.performanceTitle}>
                {selectedChart === 'sales'
                  ? 'Productos Menos Vendidos'
                  : 'Productos Menos Rentables'}
              </Text>

              <FlatList
                data={selectedChart === 'sales' ? worstSelling : unprofitable}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[styles.performanceCard, styles.warningCard]}>
                    <Text style={styles.performanceCardTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.performanceCardValue}>
                      {selectedChart === 'sales'
                        ? `${item.quantitySold} unid.`
                        : `${formatCurrency(item.profit)}`}
                    </Text>
                    <Text style={styles.performanceCardSubtitle}>
                      {selectedChart === 'sales'
                        ? `Stock: ${item.currentStock} unid.`
                        : `Margen: ${item.profitMargin.toFixed(1)}%`}
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        )}
      />
    );
  };

  // Pestaña de patrones estacionales
  const renderSeasonalTab = () => {
    if (!seasonalPatterns) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>
            Analizando patrones estacionales...
          </Text>
        </View>
      );
    }

    const { byDayOfWeek, byHourOfDay, recommendations } = seasonalPatterns;
    const chartData = getSeasonalChartData();

    // Se puede mantener como ScrollView ya que no contiene FlatList
    return (
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Ventas por Día de la Semana</Text>

          {chartData.labels.length > 0 ? (
            <BarChart
              data={chartData}
              width={isTablet() ? wp(90) : wp(92)}
              height={hp(25)}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(45, 55, 72, ${opacity})`,
                style: {
                  borderRadius: dimensions.borderRadiusMedium,
                },
              }}
              style={{
                marginVertical: hp(1),
                borderRadius: dimensions.borderRadiusMedium,
              }}
            />
          ) : (
            <View style={styles.noDataChart}>
              <Text style={styles.noDataText}>
                No hay suficientes datos para analizar patrones.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.seasonalInsights}>
          <Text style={styles.insightTitle}>Insights de Estacionalidad</Text>

          <View style={styles.insightCard}>
            <Ionicons
              name="calendar-outline"
              size={wp(6)}
              color={colors.primary}
            />
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Días de Mayor Venta</Text>
              <Text style={styles.insightValue}>
                {recommendations.peakDays.length > 0
                  ? recommendations.peakDays.join(', ')
                  : 'Sin datos suficientes'}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons name="time-outline" size={wp(6)} color={colors.primary} />
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Horas Pico</Text>
              <Text style={styles.insightValue}>
                {recommendations.peakHours.length > 0
                  ? recommendations.peakHours.join(', ')
                  : 'Sin datos suficientes'}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons
              name="people-outline"
              size={wp(6)}
              color={colors.primary}
            />
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Recomendación de Personal</Text>
              <Text style={styles.insightValue}>
                {recommendations.staffingRecommendation ||
                  'Sin recomendaciones disponibles'}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Ionicons
              name="trending-up-outline"
              size={wp(6)}
              color={colors.primary}
            />
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Temporada Alta</Text>
              <Text style={styles.insightValue}>
                {recommendations.highSeasonMonths.length > 0
                  ? recommendations.highSeasonMonths.join(', ')
                  : 'Sin datos suficientes'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Análisis Avanzado</Text>

          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodOption,
                selectedPeriod === 30 && styles.periodOptionActive,
              ]}
              onPress={() => changePeriod(30)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === 30 && styles.periodTextActive,
                ]}
              >
                30 días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOption,
                selectedPeriod === 90 && styles.periodOptionActive,
              ]}
              onPress={() => changePeriod(90)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === 90 && styles.periodTextActive,
                ]}
              >
                90 días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOption,
                selectedPeriod === 180 && styles.periodOptionActive,
              ]}
              onPress={() => changePeriod(180)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === 180 && styles.periodTextActive,
                ]}
              >
                180 días
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'predictions' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('predictions')}
            >
              <Ionicons
                name="trending-up-outline"
                size={wp(5)}
                color={
                  activeTab === 'predictions'
                    ? colors.primary
                    : colors.textLight
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'predictions' && styles.activeTabText,
                ]}
              >
                Predicciones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'restock' && styles.activeTab]}
              onPress={() => setActiveTab('restock')}
            >
              <Ionicons
                name="refresh-outline"
                size={wp(5)}
                color={
                  activeTab === 'restock' ? colors.primary : colors.textLight
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'restock' && styles.activeTabText,
                ]}
              >
                Reabastecimiento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'performance' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('performance')}
            >
              <Ionicons
                name="stats-chart-outline"
                size={wp(5)}
                color={
                  activeTab === 'performance'
                    ? colors.primary
                    : colors.textLight
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'performance' && styles.activeTabText,
                ]}
              >
                Rendimiento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'seasonal' && styles.activeTab]}
              onPress={() => setActiveTab('seasonal')}
            >
              <Ionicons
                name="calendar-outline"
                size={wp(5)}
                color={
                  activeTab === 'seasonal' ? colors.primary : colors.textLight
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'seasonal' && styles.activeTabText,
                ]}
              >
                Estacionalidad
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Eliminado el ScrollView principal que causaba el error */}
        <View style={styles.contentContainer}>{renderTabContent()}</View>
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
  contentContainer: {
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
    marginBottom: hp(1),
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(1),
  },
  periodOption: {
    flex: 1,
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    alignItems: 'center',
    borderRadius: dimensions.borderRadiusSmall,
  },
  periodOptionActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: wp(3.5),
    color: colors.text,
  },
  periodTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    paddingHorizontal: wp(2),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginHorizontal: wp(1),
    borderRadius: dimensions.borderRadiusLarge,
  },
  activeTab: {
    backgroundColor: `${colors.primary}10`,
  },
  tabText: {
    marginLeft: wp(1.5),
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(10),
    minHeight: hp(30),
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(10),
    minHeight: hp(30),
  },
  errorText: {
    marginVertical: hp(1.5),
    fontSize: wp(4),
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: dimensions.borderRadiusMedium,
    marginTop: hp(2),
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: wp(4),
  },
  tabContent: {
    padding: wp(4),
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  chartTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(1.5),
  },
  noDataChart: {
    height: hp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: wp(3.5),
    color: colors.textLight,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(3),
  },
  legendColor: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginRight: wp(1.5),
  },
  legendText: {
    fontSize: wp(3.2),
    color: colors.textLight,
  },
  predictionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: hp(2),
  },
  summaryCard: {
    flex: 1,
    minWidth: wp(isTablet() ? 25 : 44),
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
    marginHorizontal: wp(1),
    marginBottom: hp(1),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(0.5),
  },
  summaryValue: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(0.3),
  },
  summarySubtitle: {
    fontSize: wp(3),
    color: colors.textLight,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}05`,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
    marginTop: hp(1),
  },
  infoText: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(3.5),
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(10),
    minHeight: hp(30),
  },
  emptyTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
    marginTop: hp(1.5),
    marginBottom: hp(1),
  },
  emptyText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
    maxWidth: wp(80),
  },
  sectionHeader: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginTop: hp(0.5),
  },
  restockItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(1.5),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
    borderLeftWidth: wp(1),
  },
  highUrgency: {
    borderLeftColor: colors.danger,
  },
  mediumUrgency: {
    borderLeftColor: colors.warning,
  },
  lowUrgency: {
    borderLeftColor: colors.info,
  },
  restockInfo: {
    flex: 3,
  },
  restockName: {
    fontSize: wp(4),
    fontWeight: '500',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  restockSku: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(1),
  },
  restockMetrics: {
    flexDirection: 'row',
    marginBottom: hp(0.5),
  },
  metricLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
    width: wp(25),
  },
  metricValue: {
    fontSize: wp(3.5),
    fontWeight: '500',
    color: colors.text,
  },
  restockAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: wp(3),
  },
  daysUntilOutLabel: {
    fontSize: wp(3.5),
    textAlign: 'center',
    color: colors.textLight,
    marginBottom: hp(1),
  },
  recommendedQuantity: {
    fontSize: wp(3.5),
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  performanceSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(2),
  },
  selectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(3),
    marginHorizontal: wp(2),
    borderRadius: dimensions.borderRadiusMedium,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  selectorText: {
    marginLeft: wp(2),
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  selectorTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  performanceSection: {
    marginBottom: hp(2.5),
  },
  performanceTitle: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(1.5),
  },
  performanceCard: {
    width: wp(40),
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginRight: wp(3),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  warningCard: {
    borderTopWidth: hp(0.4),
    borderTopColor: colors.warning,
  },
  performanceCardTitle: {
    fontSize: wp(3.5),
    fontWeight: '500',
    color: colors.text,
    marginBottom: hp(1.5),
    height: hp(5),
  },
  performanceCardValue: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  performanceCardSubtitle: {
    fontSize: wp(3),
    color: colors.textLight,
  },
  seasonalInsights: {
    marginTop: hp(1),
  },
  insightTitle: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(1.5),
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(4),
    marginBottom: hp(1.5),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: dimensions.shadowOpacityLight,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  insightContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  insightLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(0.5),
  },
  insightValue: {
    fontSize: wp(4),
    fontWeight: '500',
    color: colors.text,
  },
});

export default AnalyticsScreen;
