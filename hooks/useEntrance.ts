import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const ENTRANCE_DURATION = 400;
const ENTRANCE_TRANSLATE = 24;

/**
 * Fade + slide de baixo pra cima. Use em cards com delay escalonado.
 * @param delay ms antes de iniciar
 */
export function useFadeSlideIn(delay: number = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(ENTRANCE_TRANSLATE);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: ENTRANCE_DURATION,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: ENTRANCE_DURATION,
        easing: Easing.out(Easing.ease),
      });
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

/**
 * Handlers para botões/cards clicáveis: scale 1 -> 0.96 com spring.
 */
export function usePressScale() {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
}
