import React from 'react';
import {Text, TextStyle} from 'react-native';
import {useTheme} from '@theme/index';
import {formatMoney, Paise} from '@utils/money';

interface MoneyProps {
  paise: Paise;
  style?: TextStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorOverride?: string;
  signed?: boolean;
}

const sizeMap = {sm: 13, md: 15, lg: 20, xl: 28} as const;

export function Money({paise, style, size = 'md', colorOverride, signed}: MoneyProps): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: sizeMap[size],
          fontWeight: '700',
          color: colorOverride ?? colors.text,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}>
      {formatMoney(paise, {signed})}
    </Text>
  );
}
