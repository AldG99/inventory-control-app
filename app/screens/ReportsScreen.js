import React, { useState, useEffect, useContext } from 'react';
import {
 StyleSheet,
 View,
 Text,
 TouchableOpacity,
 ScrollView,
 ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import colors from '../constants/colors';

const ReportsScreen = () => {
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
 sale.items?.reduce(
 (itemSum, item) => itemSum + (item.quantity || 0),
 0
 ) || 0
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

 return (
 <SafeAreaView style={styles.safeArea}>
 <View style={styles.container}>
 <View style={styles.header}>
 <Text style={styles.headerTitle}>Reportes y Estadísticas</Text>
 </View>

 <ScrollView style={styles.content}>
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
 <Text style={styles.sectionTitle}>Resumen de Ventas</Text>

 <View style={styles.statsContainer}>
 <View style={styles.statCard}>
 <Ionicons
 name="cart-outline"
 size={24}
 color={colors.primary}
 />
 <View style={styles.statContent}>
 <Text style={styles.statValue}>{totalSales}</Text>
 <Text style={styles.statLabel}>Ventas</Text>
 </View>
 </View>

 <View style={styles.statCard}>
 <Ionicons
 name="cash-outline"
 size={24}
 color={colors.success}
 />
 <View style={styles.statContent}>
 <Text style={styles.statValue}>
 {formatCurrency(totalRevenue)}
 </Text>
 <Text style={styles.statLabel}>Ingresos</Text>
 </View>
 </View>

 <View style={styles.statCard}>
 <Ionicons
 name="cube-outline"
 size={24}
 color={colors.info}
 />
 <View style={styles.statContent}>
 <Text style={styles.statValue}>{totalItemsSold}</Text>
 <Text style={styles.statLabel}>Productos vendidos</Text>
 </View>
 </View>
 </View>

 {/* Ventas por método de pago */}
 <View style={styles.paymentMethodsContainer}>
 <Text style={styles.subsectionTitle}>Por Método de Pago</Text>

 {Object.entries(salesByPaymentMethod).map(
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
 size={18}
 color={colors.textLight}
 />
 <Text style={styles.paymentMethodName}>{method}</Text>
 </View>
 <Text style={styles.paymentMethodCount}>
 {data.count} ventas
 </Text>
 <Text style={styles.paymentMethodTotal}>
 {formatCurrency(data.total)}
 </Text>
 </View>
 )
 )}
 </View>
 </View>

 {/* Resumen de Inventario */}
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Resumen de Inventario</Text>

 <View style={styles.statsContainer}>
 <View style={styles.statCard}>
 <Ionicons
 name="pricetag-outline"
 size={24}
 color={colors.primary}
 />
 <View style={styles.statContent}>
 <Text style={styles.statValue}>{totalProducts}</Text>
 <Text style={styles.statLabel}>Productos</Text>
 </View>
 </View>

 <View style={styles.statCard}>
 <Ionicons
 name="layers-outline"
 size={24}
 color={colors.info}
 />
 <View style={styles.statContent}>
 <Text style={styles.statValue}>{totalItems}</Text>
 <Text style={styles.statLabel}>Unidades</Text>
 </View>
 </View>

 <View style={styles.statCard}>
 <Ionicons
 name="wallet-outline"
 size={24}
 color={colors.success}
 />
 <View style={styles.statContent}>
 <Text style={styles.statValue}>
 {formatCurrency(inventoryValue)}
 </Text>
 <Text style={styles.statLabel}>Valor</Text>
 </View>
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
 content: {
 flex: 1,
 padding: 16,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 40,
 minHeight: 200,
 },
 loadingText: {
 marginTop: 10,
 fontSize: 16,
 color: colors.textLight,
 },
 periodFilter: {
 backgroundColor: colors.white,
 borderRadius: 12,
 padding: 16,
 marginBottom: 16,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 1 },
 shadowOpacity: 0.1,
 shadowRadius: 2,
 elevation: 2,
 },
 periodTitle: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 12,
 },
 periodOptions: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 },
 periodOption: {
 flex: 1,
 paddingVertical: 8,
 alignItems: 'center',
 borderWidth: 1,
 borderColor: colors.border,
 marginHorizontal: 2,
 borderRadius: 4,
 },
 selectedPeriodOption: {
 backgroundColor: colors.primary,
 borderColor: colors.primary,
 },
 periodOptionText: {
 fontSize: 14,
 color: colors.text,
 },
 selectedPeriodOptionText: {
 color: colors.white,
 fontWeight: '500',
 },
 section: {
 backgroundColor: colors.white,
 borderRadius: 12,
 padding: 16,
 marginBottom: 16,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 1 },
 shadowOpacity: 0.1,
 shadowRadius: 2,
 elevation: 2,
 },
 sectionTitle: {
 fontSize: 18,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 16,
 },
 statsContainer: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 flexWrap: 'wrap',
 marginBottom: 20,
 },
 statCard: {
 width: '31%',
 backgroundColor: colors.background,
 borderRadius: 8,
 padding: 12,
 alignItems: 'center',
 },
 statContent: {
 marginTop: 8,
 alignItems: 'center',
 },
 statValue: {
 fontSize: 16,
 fontWeight: 'bold',
 color: colors.text,
 marginBottom: 4,
 textAlign: 'center',
 },
 statLabel: {
 fontSize: 12,
 color: colors.textLight,
 textAlign: 'center',
 },
 subsectionTitle: {
 fontSize: 16,
 fontWeight: '500',
 color: colors.text,
 marginBottom: 12,
 },
 paymentMethodsContainer: {
 backgroundColor: colors.background,
 borderRadius: 8,
 padding: 12,
 },
 paymentMethodItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 10,
 borderBottomWidth: 1,
 borderBottomColor: colors.grayLight,
 },
 paymentMethodInfo: {
 flexDirection: 'row',
 alignItems: 'center',
 flex: 1,
 },
 paymentMethodName: {
 marginLeft: 8,
 fontSize: 14,
 color: colors.text,
 },
 paymentMethodCount: {
 fontSize: 14,
 color: colors.textLight,
 marginRight: 12,
 },
 paymentMethodTotal: {
 fontSize: 14,
 fontWeight: 'bold',
 color: colors.text,
 minWidth: 80,
 textAlign: 'right',
 },
 inventoryStatusContainer: {
 backgroundColor: colors.background,
 borderRadius: 8,
 padding: 12,
 },
 inventoryStatusItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 10,
 borderBottomWidth: 1,
 borderBottomColor: colors.grayLight,
 },
 statusInfo: {
 flexDirection: 'row',
 alignItems: 'center',
 },
 statusIndicator: {
 width: 12,
 height: 12,
 borderRadius: 6,
 marginRight: 8,
 },
 lowStockIndicator: {
 backgroundColor: colors.warning,
 },
 outOfStockIndicator: {
 backgroundColor: colors.danger,
 },
 statusName: {
 fontSize: 14,
 color: colors.text,
 },
 statusCount: {
 fontSize: 14,
 fontWeight: '500',
 color: colors.textLight,
 },
});

export default ReportsScreen;
