import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import { wp, hp, isTablet, dimensions } from '../utils/responsive';
import colors from '../constants/colors';

const SettingsScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Estados para configuraciones
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState('5');

  // Estados para el modal de edición de perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      // AppNavigator cambiará automáticamente a la pantalla de inicio de sesión
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      { text: 'Cerrar Sesión', onPress: handleLogout },
    ]);
  };

  const saveProfileChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      setSaving(true);

      // Actualizar el perfil en Firestore
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      await updateDoc(userRef, {
        name,
        businessName,
        updatedAt: new Date(),
      });

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert(
        'Error',
        'No se pudo actualizar el perfil. Inténtalo de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Mostrar indicador de carga mientras se cierra sesión
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cerrando sesión...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sección de Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil de Usuario</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileIconContainer}>
              <Text style={styles.profileIconText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.businessName && (
                <Text style={styles.businessName}>{user.businessName}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="pencil" size={wp(4.5)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Configuración */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Configuración de la Aplicación
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons
                name="notifications-outline"
                size={wp(5.5)}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>Notificaciones</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
              thumbColor={notificationsEnabled ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={wp(5.5)}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>Alerta de stock bajo</Text>
            </View>
            <View style={styles.thresholdInputContainer}>
              <TextInput
                style={styles.thresholdInput}
                value={lowStockAlertThreshold}
                onChangeText={setLowStockAlertThreshold}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.thresholdLabel}>unidades</Text>
            </View>
          </View>
        </View>

        {/* Sección de Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLabelContainer}>
              <Ionicons
                name="help-circle-outline"
                size={wp(5.5)}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.optionLabel}>Ayuda y Soporte</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={wp(5)}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLabelContainer}>
              <Ionicons
                name="document-text-outline"
                size={wp(5.5)}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.optionLabel}>Términos y Condiciones</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={wp(5)}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLabelContainer}>
              <Ionicons
                name="shield-outline"
                size={wp(5.5)}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.optionLabel}>Política de Privacidad</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={wp(5)}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Ionicons
            name="log-out-outline"
            size={wp(5.5)}
            color={colors.white}
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Versión de la aplicación */}
        <Text style={styles.versionText}>Versión 1.0.0</Text>
      </ScrollView>

      {/* Modal para editar perfil */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={wp(6)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del Negocio</Text>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Nombre de tu negocio (opcional)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={saveProfileChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(2),
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  profileIconText: {
    fontSize: wp(8),
    fontWeight: 'bold',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: hp(0.5),
  },
  profileEmail: {
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(0.5),
  },
  businessName: {
    fontSize: wp(3.5),
    color: colors.textLight,
    fontStyle: 'italic',
  },
  editButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: 0.3,
    shadowRadius: wp(1),
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: wp(3),
  },
  settingLabel: {
    fontSize: wp(4),
    color: colors.text,
  },
  thresholdInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdInput: {
    backgroundColor: colors.background,
    width: wp(15),
    height: hp(5),
    borderRadius: dimensions.borderRadiusSmall,
    paddingHorizontal: wp(2),
    marginRight: wp(2),
    textAlign: 'center',
    fontSize: wp(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  thresholdLabel: {
    fontSize: wp(3.5),
    color: colors.textLight,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: wp(4),
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.danger,
    padding: hp(2),
    borderRadius: dimensions.borderRadiusMedium,
    marginVertical: hp(2.5),
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: 0.2,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  logoutText: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: wp(2),
  },
  logoutIcon: {
    marginRight: wp(2),
  },
  versionText: {
    textAlign: 'center',
    fontSize: wp(3.5),
    color: colors.textLight,
    marginBottom: hp(2.5),
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
    width: isTablet() ? '60%' : '90%',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: wp(1) },
    shadowOpacity: 0.2,
    shadowRadius: wp(2),
    elevation: 5,
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
  inputContainer: {
    marginBottom: hp(2.5),
  },
  inputLabel: {
    fontSize: wp(4),
    marginBottom: hp(1),
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    height: hp(6.5),
    borderRadius: dimensions.borderRadiusMedium,
    paddingHorizontal: wp(3),
    fontSize: wp(4),
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: hp(6.5),
    borderRadius: dimensions.borderRadiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: dimensions.shadowOffsetHeight },
    shadowOpacity: 0.2,
    shadowRadius: dimensions.shadowRadius,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: wp(4),
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
