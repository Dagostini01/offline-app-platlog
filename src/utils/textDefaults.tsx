// src/utils/textDefaults.ts
import { Platform, Text, type TextStyle } from 'react-native';

const isAndroid = Platform.OS === 'android';

// Preserva defaults já existentes
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  // Melhora cálculo de largura no Android
  ...(isAndroid ? { textBreakStrategy: 'simple' } : null),

  // Estilo padrão para TODO Text do app (vem antes do style local)
  style: [
    // mantém qualquer estilo default já existente
    (Text as any).defaultProps?.style ?? null,
    // folga extra na direita + remove padding interno do Android
    isAndroid ? ({ paddingRight: 6, includeFontPadding: false } as TextStyle) : null,
  ].filter(Boolean),
};
