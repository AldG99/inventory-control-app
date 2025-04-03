import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import colors from '../constants/colors';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { products, loading: productsLoading } = useContext(InventoryContext);
  const [recentSales, setRecentSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estadísticas del inventario
  const totalProducts = products.length;
  const totalItems = products.reduce(
    (sum, product) => sum + (product.quantity || 0),
    0
  );
  const lowStockProducts = products.filter(
    product => product.quantity <= 5
  ).length;

  // Calcular el valor total del inventario (precio * cantidad)
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
    0
  );

  // Cargar ventas recientes
  const loadRecentSales = async () => {
    try {
      setSalesLoading(true);
      // Crear una consulta para obtener las 5 ventas más recientes
      const salesQuery = query(
        collection(db, COLLECTIONS.SALES),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(salesQuery);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
      }));

      setRecentSales(salesData);
    } catch (error) {
      console.error('Error al cargar ventas recientes:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  // Cargar ventas al montar el componente
  useEffect(() => {
    loadRecentSales();
  }, []);

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentSales();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Saludo */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>
              Hola, {user?.name || 'Usuario'}
            </Text>
            <Text style={styles.businessText}>
              {user?.businessName || 'Tu Negocio'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              navigation.navigate('Inventory', { screen: 'AddProduct' })
            }
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Tarjetas de resumen */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View
              style={[styles.summaryCard, { backgroundColor: colors.primary }]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Productos</Text>
                <Text style={styles.cardValue}>{totalProducts}</Text>
              </View>
              <View style={styles.cardIcon}>
                <Ionicons name="cube-outline" size={32} color={colors.white} />
              </View>
            </View>

            <View
              style={[styles.summaryCard, { backgroundColor: colors.info }]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Unidades</Text>
                <Text style={styles.cardValue}>{totalItems}</Text>
              </View>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="layers-outline"
                  size={32}
                  color={colors.white}
                />
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View
              style={[styles.summaryCard, { backgroundColor: colors.warning }]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Stock Bajo</Text>
                <Text style={styles.cardValue}>{lowStockProducts}</Text>
              </View>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={32}
                  color={colors.white}
                />
              </View>
            </View>

            <View
              style={[styles.summaryCard, { backgroundColor: colors.success }]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Valor</Text>
                <Text style={styles.cardValue}>
                  {formatCurrency(inventoryValue)}
                </Text>
              </View>
              <View style={styles.cardIcon}>
                <Ionicons name="cash-outline" size={32} color={colors.white} />
              </View>
            </View>
          </View>
        </View>

        {/* Sección de Accesos Rápidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => navigation.navigate('Inventory')}
            >
              <View
                style={[
                  styles.quickLinkIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name="list" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickLinkText}>Inventario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLink}
              onPress={() =>
                navigation.navigate('Sales', { screen: 'SalesRegister' })
              }
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: '#FFE8CC' }]}
              >
                <Ionicons name="cart" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.quickLinkText}>Nueva Venta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLink}
              onPress={() =>
                navigation.navigate('Sales', { screen: 'SalesHistory' })
              }
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: '#E5F5FF' }]}
              >
                <Ionicons name="document-text" size={24} color={colors.info} />
              </View>
              <Text style={styles.quickLinkText}>Historial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => navigation.navigate('Reports')}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: '#E8F5E9' }]}
              >
                <Ionicons name="bar-chart" size={24} color={colors.success} />
              </View>
              <Text style={styles.quickLinkText}>Reportes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ventas Recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ventas Recientes</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Sales', { screen: 'SalesHistory' })
              }
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {salesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando ventas...</Text>
            </View>
          ) : recentSales.length > 0 ? (
            <View style={styles.salesList}>
              {recentSales.map(sale => (
                <View key={sale.id} style={styles.saleItem}>
                  <View style={styles.saleInfo}>
                    <Text style={styles.saleId}>
                      Venta #{sale.id.slice(-6)}
                    </Text>
                    <Text style={styles.saleDate}>
                      {sale.createdAt
                        ? formatDate(sale.createdAt)
                        : 'Fecha no disponible'}
                    </Text>
                    <Text style={styles.saleItemsCount}>
                      {sale.items?.length || 0} productos
                    </Text>
                  </View>
                  <Text style={styles.saleTotal}>
                    {formatCurrency(sale.total || 0)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay ventas recientes</Text>
            </View>
          )}
        </View>

        {/* Productos con Bajo Stock */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos con Bajo Stock</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
          ) : products.filter(p => p.quantity <= 5).length > 0 ? (
            <View style={styles.lowStockList}>
              {products
                .filter(product => product.quantity <= 5)
                .slice(0, 5)
                .map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.lowStockItem}
                    onPress={() =>
                      navigation.navigate('Inventory', {
                        screen: 'ProductDetail',
                        params: { productId: product.id },
                      })
                    }
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productSku}>
                        SKU: {product.sku || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.quantityContainer}>
                      <Text
                        style={[
                          styles.quantityText,
                          product.quantity <= 0
                            ? styles.outOfStock
                            : styles.lowQuantity,
                        ]}
                      >
                        {product.quantity <= 0
                          ? 'Agotado'
                          : `${product.quantity} uds.`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay productos con bajo stock
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: 16,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  businessText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLink: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  salesList: {
    marginTop: 8,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  saleDate: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  saleItemsCount: {
    fontSize: 13,
    color: colors.textLight,
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.textLight,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textLight,
    textAlign: 'center',
  },
  lowStockList: {
    marginTop: 8,
  },
  lowStockItem: {
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
    marginBottom: 2,
  },
  productSku: {
    fontSize: 13,
    color: colors.textLight,
  },
  quantityContainer: {
    marginLeft: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowQuantity: {
    backgroundColor: '#FFF8E1',
    color: '#F57C00',
  },
  outOfStock: {
    backgroundColor: '#FFEBEE',
    color: colors.danger,
  },
});

export default HomeScreen;
