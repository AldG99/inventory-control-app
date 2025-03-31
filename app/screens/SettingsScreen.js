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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
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
      <ScrollView style={styles.container}>
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
              <Ionicons name="pencil" size={18} color={colors.white} />
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
                size={22}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>Notificaciones</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.gray, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>Alerta de stock bajo</Text>
            </View>
            <TextInput
              style={styles.thresholdInput}
              value={lowStockAlertThreshold}
              onChangeText={setLowStockAlertThreshold}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        {/* Sección de Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLabelContainer}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.optionLabel}>Ayuda y Soporte</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLabelContainer}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.optionLabel}>Términos y Condiciones</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionLabelContainer}>
              <Ionicons
                name="shield-outline"
                size={22}
                color={colors.textLight}
                style={styles.settingIcon}
              />
              <Text style={styles.optionLabel}>Política de Privacidad</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Ionicons
            name="log-out-outline"
            size={22}
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
                <Ionicons name="close" size={24} color={colors.text} />
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
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del Negocio</Text>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Nombre de tu negocio (opcional)"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={saveProfileChanges}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
