import React from 'react';
import {
  Platform,
  Text as RNText,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from 'react-native';

(function patchGlobalText() {
  if (Platform.OS !== 'android') return;

  type TextRuntime = typeof RNText & {
    render: (...args: any[]) => React.ReactElement<TextProps>;
  };

  const TextAny = RNText as unknown as TextRuntime;
  const originalRender = TextAny.render;

  // Adiciona um hair space no final de strings
  const appendHairSpace = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') {
      // evita duplicar espaço se já terminar com espaço
      return /\s$/.test(children) ? children : children + '\u200A';
    }
    if (Array.isArray(children)) {
      if (children.length === 0) return children;
      const last = children[children.length - 1];
      const patchedLast = appendHairSpace(last);
      if (patchedLast === last) return children;
      const copy = children.slice();
      copy[copy.length - 1] = patchedLast;
      return copy;
    }
    return children;
  };

  TextAny.render = function (...args: any[]) {
    const origin = originalRender.apply(this, args) as React.ReactElement<TextProps>;

    // Flatten para ler fontSize/lineHeight com segurança
    const flat: TextStyle = StyleSheet.flatten(origin.props?.style) || {};

    const fixStyle: TextStyle[] = [
      { paddingRight: 4 }, // folga maior na direita
    ];
    if (flat.fontSize && !flat.lineHeight) {
      fixStyle.push({ lineHeight: Math.ceil((flat.fontSize as number) * 1.2) });
    }

    const mergedStyle = Array.isArray(origin.props?.style)
      ? [...origin.props!.style, ...fixStyle]
      : [origin.props?.style, ...fixStyle];

    // textBreakStrategy ajuda na quebra/cálculo de largura
    const mergedProps: TextProps = {
      ...origin.props,
      style: mergedStyle,
      // se o dev já passou, mantemos o dele
      textBreakStrategy: (origin.props as any)?.textBreakStrategy ?? 'simple',
      children: appendHairSpace(origin.props?.children),
    };

    return React.cloneElement(origin, mergedProps);
  };
})();
