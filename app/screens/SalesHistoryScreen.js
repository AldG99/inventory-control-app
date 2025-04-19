import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';
import colors from '../constants/colors';

const SalesHistoryScreen = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Cargar historial de ventas
  const loadSales = async () => {
    try {
      setLoading(true);
      // Consultar todas las ventas ordenadas por fecha (más recientes primero)
      const salesQuery = query(
        collection(db, COLLECTIONS.SALES),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(salesQuery);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
      }));

      setSales(salesData);
    } catch (error) {
      console.error('Error al cargar historial de ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar ventas al montar el componente
  useEffect(() => {
    loadSales();
  }, []);

  // Filtrar ventas según el filtro de fecha
  const filteredSales = sales.filter(sale => {
    if (dateFilter === 'all') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saleDate = sale.createdAt;
    if (!saleDate) return false;

    if (dateFilter === 'today') {
      const saleDay = new Date(saleDate);
      saleDay.setHours(0, 0, 0, 0);
      return saleDay.getTime() === today.getTime();
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return saleDate >= weekAgo;
    }

    if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return saleDate >= monthAgo;
    }

    return true;
  });

  // Calcular totales
  const totalSales = filteredSales.length;
  const totalAmount = filteredSales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  };

  // Formatear fecha
  const formatDate = date => {
    if (!date) return 'Fecha desconocida';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Ver detalle de una venta
  const viewSaleDetails = sale => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  // Renderizar cada venta en la lista
  const renderSaleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.saleItem}
      onPress={() => viewSaleDetails(item)}
    >
      <View style={styles.saleHeader}>
        <View>
          <Text style={styles.saleId}>Venta #{item.id.slice(-6)}</Text>
          <Text style={styles.saleDate}>
            {item.createdAt
              ? formatDate(item.createdAt)
              : 'Fecha no disponible'}
          </Text>
        </View>
        <Text style={styles.saleTotal}>{formatCurrency(item.total || 0)}</Text>
      </View>

      <View style={styles.saleInfo}>
        <View style={styles.saleInfoItem}>
          <Ionicons name="cart-outline" size={wp(4)} color={colors.textLight} />
          <Text style={styles.saleInfoText}>
            {item.items?.length || 0} productos
          </Text>
        </View>

        <View style={styles.saleInfoItem}>
          <Ionicons
            name={
              item.paymentMethod === 'Efectivo'
                ? 'cash-outline'
                : item.paymentMethod === 'Tarjeta'
                ? 'card-outline'
                : 'repeat-outline'
            }
            size={wp(4)}
            color={colors.textLight}
          />
          <Text style={styles.saleInfoText}>
            {item.paymentMethod || 'Efectivo'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historial de Ventas</Text>
        </View>

        {/* Filtros de fecha */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              dateFilter === 'all' && styles.activeFilterOption,
            ]}
            onPress={() => setDateFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                dateFilter === 'all' && styles.activeFilterText,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              dateFilter === 'today' && styles.activeFilterOption,
            ]}
            onPress={() => setDateFilter('today')}
          >
            <Text
              style={[
                styles.filterText,
                dateFilter === 'today' && styles.activeFilterText,
              ]}
            >
              Hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              dateFilter === 'week' && styles.activeFilterOption,
            ]}
            onPress={() => setDateFilter('week')}
          >
            <Text
              style={[
                styles.filterText,
                dateFilter === 'week' && styles.activeFilterText,
              ]}
            >
              Esta semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              dateFilter === 'month' && styles.activeFilterOption,
            ]}
            onPress={() => setDateFilter('month')}
          >
            <Text
              style={[
                styles.filterText,
                dateFilter === 'month' && styles.activeFilterText,
              ]}
            >
              Este mes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resumen de ventas filtradas */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ventas:</Text>
            <Text style={styles.summaryValue}>{totalSales}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando ventas...</Text>
          </View>
        ) : filteredSales.length > 0 ? (
          <FlatList
            data={filteredSales}
            renderItem={renderSaleItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.salesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={wp(15)}
              color={colors.textMuted}
            />
            <Text style={styles.emptyStateTitle}>
              No hay ventas registradas
            </Text>
            <Text style={styles.emptyStateText}>
              {dateFilter !== 'all'
                ? 'No hay ventas en el período seleccionado'
                : 'Las ventas que registres aparecerán aquí'}
            </Text>
          </View>
        )}

        {/* Modal de detalle de venta */}
        <Modal visible={showSaleModal} animationType="slide" transparent={true}>
          {selectedSale && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalle de Venta</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowSaleModal(false)}
                  >
                    <Ionicons name="close" size={wp(6)} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Información general */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Venta #</Text>
                      <Text style={styles.detailValue}>
                        {selectedSale.id.slice(-6)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecha</Text>
                      <Text style={styles.detailValue}>
                        {selectedSale.createdAt
                          ? formatDate(selectedSale.createdAt)
                          : 'Fecha no disponible'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Método de pago</Text>
                      <Text style={styles.detailValue}>
                        {selectedSale.paymentMethod || 'Efectivo'}
                      </Text>
                    </View>
                    {selectedSale.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.detailLabel}>Notas</Text>
                        <Text style={styles.notesText}>
                          {selectedSale.notes}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Productos */}
                  <View style={styles.productSection}>
                    <Text style={styles.sectionTitle}>Productos</Text>
                    {selectedSale.items &&
                      selectedSale.items.map((item, index) => (
                        <View key={index} style={styles.productItem}>
                          <View style={styles.productInfo}>
                            <Text style={styles.productName}>
                              {item.productName}
                            </Text>
                            <View style={styles.productPriceQuantity}>
                              <Text style={styles.productQuantity}>
                                {item.quantity} x{' '}
                              </Text>
                              <Text style={styles.productPrice}>
                                {formatCurrency(item.price)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.productTotal}>
                            {formatCurrency(
                              item.subtotal || item.price * item.quantity
                            )}
                          </Text>
                        </View>
                      ))}
                  </View>

                  {/* Totales */}
                  <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(selectedSale.total || 0)}
                      </Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Impuestos</Text>
                      <Text style={styles.totalValue}>{formatCurrency(0)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                      <Text style={styles.grandTotalLabel}>TOTAL</Text>
                      <Text style={styles.grandTotalValue}>
                        {formatCurrency(selectedSale.total || 0)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterOption: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    marginRight: wp(2),
    borderRadius: dimensions.borderRadiusMedium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: wp(3.5),
    color: colors.text,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    marginRight: wp(6),
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: wp(3.8),
    color: colors.textLight,
    marginRight: wp(2),
  },
  summaryValue: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
  },
  salesList: {
    padding: wp(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: wp(4),
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  emptyStateTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: hp(1.5),
  },
  emptyStateText: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
  },
  saleItem: {
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
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  saleId: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
  },
  saleDate: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(0.5),
  },
  saleTotal: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.success,
  },
  saleInfo: {
    flexDirection: 'row',
  },
  saleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
  },
  saleInfoText: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginLeft: wp(1),
  },

  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadiusMedium,
    width: isTablet() ? '70%' : '90%',
    maxHeight: '80%',
    overflow: 'hidden',
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
  modalContent: {
    padding: wp(4),
  },
  detailSection: {
    marginBottom: hp(2.5),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  detailValue: {
    fontSize: wp(3.5),
    fontWeight: '500',
    color: colors.text,
  },
  notesContainer: {
    marginTop: hp(1.5),
    padding: wp(3),
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusSmall,
  },
  notesText: {
    marginTop: hp(0.5),
    fontSize: wp(3.5),
    color: colors.text,
  },
  sectionTitle: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(1.5),
  },
  productSection: {
    marginBottom: hp(2.5),
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  productPriceQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  productPrice: {
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  productTotal: {
    fontSize: wp(3.8),
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalSection: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadiusMedium,
    padding: wp(3),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
  },
  totalLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  totalValue: {
    fontSize: wp(3.5),
    fontWeight: '500',
    color: colors.text,
  },
  grandTotal: {
    marginTop: hp(0.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: hp(1.5),
  },
  grandTotalLabel: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default SalesHistoryScreen;
