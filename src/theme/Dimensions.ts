import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const [shortDimension, longDimension] =
  width < height ? [width, height] : [height, width];

// Default guideline sizes from the user's file
const guidelineBaseWidth = 393;
const guidelineBaseHeight = 852;

/**
 * Scaling for horizontal dimensions (width, paddingHorizontal, etc.)
 */
export const horizontalScale = (size: number): number =>
  (shortDimension / guidelineBaseWidth) * size;

/**
 * Scaling for vertical dimensions (height, paddingTop, etc.)
 */
export const verticalScale = (size: number): number =>
  (longDimension / guidelineBaseHeight) * size;

/**
 * Moderated scaling for font sizes and other elements that shouldn't scale linearly.
 */
export const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (horizontalScale(size) - size) * factor;

/**
 * Moderated vertical scaling.
 */
export const moderateVerticalScale = (
  size: number,
  factor: number = 0.5,
): number => size + (verticalScale(size) - size) * factor;

// Shorthand exports
export const s = horizontalScale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;
