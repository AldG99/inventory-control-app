import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

// Dimensiones de la pantalla
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Valores de diseño base (puedes ajustar estos según tu diseño base)
const baseWidth = 375; // Ancho base de diseño (Por ejemplo, iPhone 8)
const baseHeight = 667; // Alto base de diseño

// Factor de escala para fuentes
const scale = SCREEN_WIDTH / baseWidth;

/**
 * Calcula el ancho basado en porcentaje de la pantalla
 * @param {number} percentage - Porcentaje del ancho de pantalla
 * @return {number} El valor calculado
 */
export const wp = percentage => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/**
 * Calcula la altura basada en porcentaje de la pantalla
 * @param {number} percentage - Porcentaje de la altura de pantalla
 * @return {number} El valor calculado
 */
export const hp = percentage => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/**
 * Normaliza el tamaño de fuente para diferentes dispositivos
 * @param {number} size - Tamaño base de la fuente
 * @return {number} Tamaño de fuente normalizado
 */
export const normalize = size => {
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Obtiene el tamaño de la barra de estado
 * @return {number} La altura de la barra de estado
 */
export const getStatusBarHeight = () => {
  return Platform.OS === 'ios'
    ? isIphoneX()
      ? 44
      : 20
    : StatusBar.currentHeight;
};

/**
 * Verifica si el dispositivo es un iPhone X o más reciente
 * @return {boolean} Si el dispositivo es iPhone X o más reciente
 */
export const isIphoneX = () => {
  const dimen = Dimensions.get('window');
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTV &&
    (dimen.height === 780 ||
      dimen.width === 780 ||
      dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 844 ||
      dimen.width === 844 ||
      dimen.height === 896 ||
      dimen.width === 896 ||
      dimen.height === 926 ||
      dimen.width === 926)
  );
};

/**
 * Obtiene el espacio inferior seguro para dispositivos con notch
 * @return {number} La altura del área segura inferior
 */
export const getBottomSpace = () => {
  return isIphoneX() ? 34 : 0;
};

// Información sobre la orientación de la pantalla
export const isPortrait = () => {
  const { width, height } = Dimensions.get('window');
  return height > width;
};

export const isLandscape = () => {
  const { width, height } = Dimensions.get('window');
  return width > height;
};

// Función para detectar si es tablet (heurística basada en tamaño y densidad)
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;

  // Heurística simple: si la dimensión menor es mayor a 600dp, consideramos que es una tablet
  return Math.min(adjustedWidth, adjustedHeight) >= 600;
};

// Utilidades para crear estilos condicionales basados en plataforma o dimensiones
export const conditionalStyle = (condition, styleIfTrue, styleIfFalse = {}) => {
  return condition ? styleIfTrue : styleIfFalse;
};

export const platformSpecificStyle = (iosStyle, androidStyle) => {
  return Platform.OS === 'ios' ? iosStyle : androidStyle;
};

export const deviceSpecificStyle = (phoneStyle, tabletStyle) => {
  return isTablet() ? tabletStyle : phoneStyle;
};

// Dimensiones comunes para componentes
export const dimensions = {
  // Bordes redondeados
  borderRadiusSmall: wp(1),
  borderRadiusMedium: wp(2.5),
  borderRadiusLarge: wp(4),
  borderRadiusXLarge: wp(8),
  borderRadiusCircular: wp(50),

  // Sombras
  shadowOffsetWidth: 0,
  shadowOffsetHeight: wp(0.5),
  shadowOpacityLight: 0.1,
  shadowOpacityMedium: 0.2,
  shadowOpacityHeavy: 0.3,
  shadowRadius: wp(1),

  // Espaciado
  spacingTiny: wp(1),
  spacingSmall: wp(2),
  spacingMedium: wp(4),
  spacingLarge: wp(6),
  spacingXLarge: wp(8),

  // Tamaños de texto
  fontSizeXSmall: wp(3),
  fontSizeSmall: wp(3.5),
  fontSizeMedium: wp(4),
  fontSizeLarge: wp(5),
  fontSizeXLarge: wp(6),
  fontSizeXXLarge: wp(8),

  // Altura de botones e inputs
  buttonHeightSmall: hp(4),
  buttonHeightMedium: hp(6),
  buttonHeightLarge: hp(7),

  // Dimensiones de iconos
  iconSizeSmall: wp(4),
  iconSizeMedium: wp(5),
  iconSizeLarge: wp(6),
  iconSizeXLarge: wp(8),
};

export default {
  wp,
  hp,
  normalize,
  getStatusBarHeight,
  isIphoneX,
  getBottomSpace,
  isPortrait,
  isLandscape,
  isTablet,
  conditionalStyle,
  platformSpecificStyle,
  deviceSpecificStyle,
  dimensions,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
