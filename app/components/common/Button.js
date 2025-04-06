import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

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
    if (disabled) return colors.gray;
   
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'secondary':
        return colors.white;
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
        style
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
        <>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={getIconColor()}
              style={styles.leftIcon}
            />
          )}
          <Text
            style={[
              getTextStyle(),
              getTextSizeStyle(),
              textStyle
            ]}
          >
            {title}
          </Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={getIconColor()}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.textLight,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    backgroundColor: colors.grayLight,
  },
  smallButton: {
    height: 36,
    paddingHorizontal: 12,
  },
  mediumButton: {
    height: 48,
    paddingHorizontal: 16,
  },
  largeButton: {
    height: 56,
    paddingHorizontal: 24,
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
    color: colors.text,
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  }
});

export default Button;
