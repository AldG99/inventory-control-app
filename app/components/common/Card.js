import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
} from 'react-native';

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
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#767676',
  border: '#F0F0F0',
  grayLight: '#F5F5F5',
  primary: '#6C63FF',
};

/**
 * Componente Card para mostrar contenido en forma de tarjeta
 *
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido de la tarjeta
 * @param {string} props.title - Título de la tarjeta
 * @param {function} props.onPress - Función a ejecutar al presionar la tarjeta (si es presionable)
 * @param {boolean} props.pressable - Si la tarjeta es presionable
 * @param {React.ReactNode} props.footer - Contenido del pie de la tarjeta
 * @param {Object} props.style - Estilos adicionales para la tarjeta
 */
const Card = ({
  children,
  title,
  onPress,
  pressable = false,
  footer,
  style,
  ...props
}) => {
  // Contenido de la tarjeta envuelto en componentes adecuados
  const cardContent = (
    <View style={[styles.card, style]} {...props}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );

  // Si es presionable, envolver en TouchableOpacity
  if (pressable && onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

/**
 * Componente de cabecera para la tarjeta (opcional)
 */
Card.Header = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

/**
 * Componente de cuerpo para la tarjeta (opcional)
 */
Card.Body = ({ children, style }) => (
  <View style={[styles.body, style]}>{children}</View>
);

/**
 * Componente de pie para la tarjeta (opcional)
 */
Card.Footer = ({ children, style }) => (
  <View style={[styles.footerContainer, style]}>{children}</View>
);

/**
 * Componente para mostrar un párrafo en la tarjeta
 */
Card.Text = ({ children, style }) => (
  <Text style={[styles.text, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  touchable: {
    borderRadius: wp(3),
    marginBottom: hp(2),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp(0.5) },
    shadowOpacity: 0.08,
    shadowRadius: wp(2),
    elevation: 2,
    marginBottom: hp(2),
    overflow: 'hidden',
  },
  title: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: colors.text,
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
  },
  footer: {
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    marginBottom: hp(1.5),
  },
  body: {
    marginBottom: hp(1.5),
  },
  footerContainer: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  text: {
    fontSize: wp(3.5),
    color: colors.text,
    lineHeight: hp(2.5),
  },
});

export default Card;
