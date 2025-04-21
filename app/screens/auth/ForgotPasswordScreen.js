import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import colors from '../../constants/colors';

// Dimensiones y utilidades responsive
const { width, height } = Dimensions.get('window');

const wp = percentage => {
  const value = (percentage * width) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

const hp = percentage => {
  const value = (percentage * height) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword } = useContext(AuthContext);

  const handleResetPassword = async () => {
    // Validación básica de email
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu dirección de email');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setEmailSent(true);
      // No navegamos automáticamente, permitimos al usuario ver el mensaje de éxito
    } catch (error) {
      let errorMessage = 'Error al enviar el email de recuperación';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No hay usuario registrado con este email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email no es válido';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Botón de regreso */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={wp(6)} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              {emailSent
                ? 'Hemos enviado un enlace para restablecer tu contraseña al email proporcionado'
                : 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña'}
            </Text>
          </View>

          {!emailSent ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={wp(5)}
                    color={colors.textLight}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.buttonText}>Enviando...</Text>
                    <View style={styles.dotsContainer}>
                      <View style={[styles.dot, styles.dot1]} />
                      <View style={[styles.dot, styles.dot2]} />
                      <View style={[styles.dot, styles.dot3]} />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    Enviar Email de Recuperación
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={wp(20)}
                  color={colors.success}
                />
              </View>
              <Text style={styles.successText}>
                Revisa tu bandeja de entrada y sigue las instrucciones del email
                para restablecer tu contraseña.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>
                  Volver al Inicio de Sesión
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!emailSent && (
            <View style={styles.loginContainer}>
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLinkText}>
                  Volver al Inicio de Sesión
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: wp(5),
  },
  backButton: {
    marginTop: hp(1),
    marginBottom: hp(2),
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(5),
  },
  title: {
    fontSize: wp(8),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: hp(1.5),
  },
  subtitle: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: wp(5),
    lineHeight: hp(2.8),
  },
  form: {
    width: '100%',
    maxWidth: wp(85),
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: hp(3),
  },
  label: {
    fontSize: wp(4),
    marginBottom: hp(1),
    color: colors.text,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: wp(3),
  },
  input: {
    flex: 1,
    height: hp(6.5),
    fontSize: wp(4),
    color: colors.text,
    paddingRight: wp(3),
  },
  button: {
    backgroundColor: colors.primary,
    height: hp(6.5),
    borderRadius: wp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.2,
    shadowRadius: wp(1.5),
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
  },
  buttonText: {
    color: colors.white,
    fontSize: wp(4.5),
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: wp(2),
  },
  dot: {
    width: wp(1.5),
    height: wp(1.5),
    borderRadius: wp(0.75),
    backgroundColor: colors.white,
    marginHorizontal: wp(0.5),
    opacity: 0.6,
  },
  dot1: {
    opacity: 0.9,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  loginLink: {
    padding: wp(3),
  },
  loginLinkText: {
    color: colors.primary,
    fontSize: wp(4),
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  successIconContainer: {
    marginBottom: hp(3),
  },
  successText: {
    fontSize: wp(4),
    color: colors.text,
    textAlign: 'center',
    marginBottom: hp(4),
    lineHeight: hp(3),
  },
});

export default ForgotPasswordScreen;
