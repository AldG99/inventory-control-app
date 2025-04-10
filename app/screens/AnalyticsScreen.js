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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import useAnalytics from '../hooks/useAnalytics';
import colors from '../constants/colors';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

const { width } = Dimensions.get('window');

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
  const [selectedChart, setSelectedChart] = useState('sales'); // 'sales' or 'profit'

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
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Verde para datos históricos
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
            size={50}
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

    return (
      <View style={styles.tabContent}>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            Tendencia de Ventas (Próximos 7 días)
          </Text>

          {chartData.labels.length > 0 ? (
            <LineChart
              data={chartData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
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
            size={24}
            color={colors.textLight}
          />
          <Text style={styles.infoText}>
            Las predicciones se basan en el historial de ventas y patrones
            identificados. Actualice regularmente para mejorar la precisión.
          </Text>
        </View>
      </View>
    );
  };

  // Pestaña de recomendaciones de reabastecimiento
  const renderRestockTab = () => {
    if (!restockRecommendations || restockRecommendations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={60}
            color={colors.success}
          />
          <Text style={styles.emptyTitle}>Inventario Saludable</Text>
          <Text style={styles.emptyText}>
            No hay productos que necesiten reabastecimiento urgente.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recomendaciones de Reabastecimiento
          </Text>
          <Text style={styles.sectionSubtitle}>
            Basado en la tasa de venta y stock actual
          </Text>
        </View>

        <FlatList
          data={restockRecommendations}
          keyExtractor={item => item.id}
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
                  <Text style={styles.metricValue}>
                    {item.quantity} unidades
                  </Text>
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
          ListFooterComponent={
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.textLight}
              />
              <Text style={styles.infoText}>
                Las recomendaciones se calculan considerando el historial de
                ventas de los últimos {selectedPeriod} días.
              </Text>
            </View>
          }
        />
      </View>
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
              size={24}
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
              size={24}
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

    return (
      <View style={styles.tabContent}>
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

    return (
      <View style={styles.tabContent}>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Ventas por Día de la Semana</Text>

          {chartData.labels.length > 0 ? (
            <BarChart
              data={chartData}
              width={width - 40}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 134, 222, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
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
              size={24}
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
            <Ionicons name="time-outline" size={24} color={colors.primary} />
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
            <Ionicons name="people-outline" size={24} color={colors.primary} />
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
              size={24}
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
      </View>
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
                size={20}
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
                size={20}
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
                size={20}
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
                size={20}
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

        <ScrollView
          style={styles.mainContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onPress={onRefresh} />
          }
        >
          {renderTabContent()}
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
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodOptionActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: 14,
    color: colors.text,
  },
  periodTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: colors.primaryLight + '30', // 30% de opacidad
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
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
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginVertical: 12,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabContent: {
    padding: 16,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  noDataChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textLight,
  },
  predictionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  restockItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
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
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  restockSku: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  restockMetrics: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.textLight,
    width: 100,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  restockAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.grayLight,
    paddingLeft: 12,
  },
  daysUntilOutLabel: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.textLight,
    marginBottom: 8,
  },
  recommendedQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  performanceSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  selectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  selectorOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  selectorText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textLight,
  },
  selectorTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  performanceSection: {
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  performanceCard: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  warningCard: {
    borderTopWidth: 3,
    borderTopColor: colors.warning,
  },
  performanceCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
    height: 40,
  },
  performanceCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  performanceCardSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  seasonalInsights: {
    marginTop: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});

export default AnalyticsScreen;
