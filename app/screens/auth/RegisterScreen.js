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

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    // Validaciones básicas
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      // Registro del usuario con datos adicionales
      await register(email, password, {
        name,
        businessName: businessName || '',
        createdAt: new Date(),
        role: 'owner',
      });
      // No necesitamos navegar, el AppNavigator cambiará automáticamente
    } catch (error) {
      let errorMessage = 'Error al registrar el usuario';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email no es válido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil';
      }

      Alert.alert('Error de registro', errorMessage);
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
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Regístrate para comenzar a gestionar tu inventario
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={wp(5)}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre completo"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre del Negocio (Opcional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="business-outline"
                  size={wp(5)}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de tu negocio"
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={wp(5)}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={wp(5)}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={wp(5)}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                    }
                    size={wp(5)}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.buttonText}>Creando cuenta</Text>
                  <View style={styles.dotsContainer}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                  </View>
                </View>
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(4),
  },
  title: {
    fontSize: wp(8),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: wp(4),
    color: colors.textLight,
    textAlign: 'center',
    maxWidth: wp(80),
  },
  form: {
    width: '100%',
    maxWidth: wp(85),
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: hp(2.5),
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
  passwordInput: {
    paddingRight: wp(10), // Espacio para el ícono del ojo
  },
  eyeIcon: {
    position: 'absolute',
    right: wp(3),
    padding: wp(2),
  },
  button: {
    backgroundColor: colors.primary,
    height: hp(6.5),
    borderRadius: wp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: hp(3),
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp(3),
  },
  loginText: {
    color: colors.textLight,
    marginRight: wp(1),
    fontSize: wp(3.5),
  },
  loginLink: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: wp(3.5),
  },
});

export default RegisterScreen;
