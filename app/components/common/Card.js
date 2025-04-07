import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import colors from '../../constants/colors';

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
  <View style={[styles.header, style]}>
    {children}
  </View>
);

/**
 * Componente de cuerpo para la tarjeta (opcional)
 */
Card.Body = ({ children, style }) => (
  <View style={[styles.body, style]}>
    {children}
  </View>
);

/**
 * Componente de pie para la tarjeta (opcional)
 */
Card.Footer = ({ children, style }) => (
  <View style={[styles.footerContainer, style]}>
    {children}
  </View>
);

/**
 * Componente para mostrar un párrafo en la tarjeta
 */
Card.Text = ({ children, style }) => (
  <Text style={[styles.text, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  header: {
    marginBottom: 12,
  },
  body: {
    marginBottom: 12,
  },
  footerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  text: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  }
});

export default Card;
