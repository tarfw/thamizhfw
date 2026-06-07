import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: number;
  style?: ViewStyle;
};

export function Card({
  variant = 'default',
  padding = 16,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  
  const variantStyle: ViewStyle = {
    default: {
      backgroundColor: theme.colors.bgElevated,
      borderRadius: theme.radius.md,
    },
    elevated: {
      backgroundColor: theme.colors.bgElevated,
      borderRadius: theme.radius.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    bordered: {
      backgroundColor: theme.colors.bgElevated,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  }[variant];

  return (
    <View
      {...rest}
      style={[variantStyle, { padding }, style]}
    >
      {children}
    </View>
  );
}
