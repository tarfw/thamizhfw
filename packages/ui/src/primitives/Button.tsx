import React from 'react';
import { Pressable, Text, type PressableProps, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const sizeMap: Record<ButtonSize, { px: number; py: number; fontSize: number }> = {
    sm: { px: 12, py: 6, fontSize: 12 },
    md: { px: 16, py: 10, fontSize: 14 },
    lg: { px: 20, py: 12, fontSize: 16 },
  };

  const variantStyles: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.colors.accent || theme.colors.primary, fg: '#FFFFFF' },
    secondary: { bg: theme.colors.bgElevated, fg: theme.colors.fg, border: theme.colors.border },
    ghost: { bg: 'transparent', fg: theme.colors.fg },
    danger: { bg: theme.colors.status?.danger || '#EF4444', fg: '#FFFFFF' },
  };

  const { px, py, fontSize } = sizeMap[size];
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? variantStyle.bg + 'CC'
          : disabled
          ? variantStyle.bg + '80'
          : variantStyle.bg,
        borderRadius: theme.radius.md,
        borderWidth: variantStyle.border ? 1 : 0,
        borderColor: variantStyle.border || 'transparent',
        paddingHorizontal: px,
        paddingVertical: py,
        opacity: disabled ? 0.5 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
      })}
    >
      {icon}
      <Text
        style={{
          color: variantStyle.fg,
          fontSize,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
