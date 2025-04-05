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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import colors from '../constants/colors';

const SalesHistoryScreen = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);

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
          <Ionicons name="cart-outline" size={16} color={colors.textLight} />
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
            size={16}
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

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando ventas...</Text>
          </View>
        ) : sales.length > 0 ? (
          <FlatList
            data={sales}
            renderItem={renderSaleItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.salesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color={colors.gray} />
            <Text style={styles.emptyStateTitle}>
              No hay ventas registradas
            </Text>
            <Text style={styles.emptyStateText}>
              Las ventas que registres aparecerán aquí
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
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
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
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  salesList: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  saleItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  saleDate: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  saleInfo: {
    flexDirection: 'row',
  },
  saleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  saleInfoText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 4,
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
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  notesText: {
    marginTop: 4,
    fontSize: 14,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  productSection: {
    marginBottom: 20,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  productPriceQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: colors.textLight,
  },
  productPrice: {
    fontSize: 14,
    color: colors.textLight,
  },
  productTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalSection: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  grandTotal: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default SalesHistoryScreen;
