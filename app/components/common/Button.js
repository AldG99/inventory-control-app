import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  PixelRatio,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// Colores modernos y minimalistas
const colors = {
  primary: '#6C63FF', // Violeta moderno
  secondary: '#F0F0F0', // Gris claro
  danger: '#FF6B6B', // Rojo suave
  success: '#4CAF50', // Verde
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#767676',
  disabled: '#D1D1D1',
};

/**
 * Componente de botón reutilizable con diferentes variantes
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Texto del botón
 * @param {function} props.onPress - Función a ejecutar al presionar
 * @param {string} props.variant - Variante del botón (primary, secondary, danger, success)
 * @param {string} props.size - Tamaño del botón (small, medium, large)
 * @param {boolean} props.fullWidth - Si el botón ocupa todo el ancho disponible
 * @param {boolean} props.disabled - Si el botón está deshabilitado
 * @param {boolean} props.loading - Si muestra un indicador de carga
 * @param {string} props.iconName - Nombre del icono de Ionicons
 * @param {string} props.iconPosition - Posición del icono (left, right)
 * @param {Object} props.style - Estilos adicionales para el botón
 * @param {Object} props.textStyle - Estilos adicionales para el texto
 */
const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  iconName,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  // Determinar estilos según variante
  const getButtonStyle = () => {
    if (disabled) return styles.disabledButton;

    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'danger':
        return styles.dangerButton;
      case 'success':
        return styles.successButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  // Determinar estilos de texto según variante
  const getTextStyle = () => {
    if (disabled) return styles.disabledButtonText;

    switch (variant) {
      case 'outline':
        return styles.outlineButtonText;
      case 'secondary':
      case 'primary':
      case 'danger':
      case 'success':
      default:
        return styles.buttonText;
    }
  };

  // Determinar tamaño del botón
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      case 'medium':
      default:
        return styles.mediumButton;
    }
  };

  // Determinar tamaño del texto según tamaño del botón
  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButtonText;
      case 'large':
        return styles.largeButtonText;
      case 'medium':
      default:
        return styles.mediumButtonText;
    }
  };

  // Determinar color del icono
  const getIconColor = () => {
    if (disabled) return colors.textLight;

    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'secondary':
        return colors.text;
      case 'danger':
        return colors.white;
      case 'success':
        return colors.white;
      case 'primary':
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidthButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : colors.white}
        />
      ) : (
        <View style={styles.contentContainer}>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={size === 'small' ? wp(4) : size === 'large' ? wp(6) : wp(5)}
              color={getIconColor()}
              style={styles.leftIcon}
            />
          )}
          <Text style={[getTextStyle(), getTextSizeStyle(), textStyle]}>
            {title}
          </Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={size === 'small' ? wp(4) : size === 'large' ? wp(6) : wp(5)}
              color={getIconColor()}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: wp(1),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: wp(0.3),
    borderColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    backgroundColor: colors.disabled,
  },
  smallButton: {
    height: hp(4.5),
    paddingHorizontal: wp(3),
  },
  mediumButton: {
    height: hp(6),
    paddingHorizontal: wp(4),
  },
  largeButton: {
    height: hp(7),
    paddingHorizontal: wp(6),
  },
  fullWidthButton: {
    width: '100%',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: colors.textLight,
  },
  smallButtonText: {
    fontSize: wp(3.5),
  },
  mediumButtonText: {
    fontSize: wp(4),
  },
  largeButtonText: {
    fontSize: wp(4.5),
  },
  leftIcon: {
    marginRight: wp(2),
  },
  rightIcon: {
    marginLeft: wp(2),
  },
});

export default Button;
