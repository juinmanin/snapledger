import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { categoryColors } from '../../theme/theme';

interface CategoryIconProps {
  category: string;
  size?: number;
}

const categoryIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  식비: 'food',
  교통: 'car',
  쇼핑: 'shopping',
  의료: 'medical-bag',
  주거: 'home',
  문화: 'movie',
  교육: 'school',
  급여: 'cash',
  부수입: 'cash-multiple',
  사업소득: 'briefcase',
  기타: 'dots-horizontal',
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 24,
}) => {
  const icon = categoryIcons[category] || 'help-circle';
  const color = categoryColors[category as keyof typeof categoryColors] || '#616161';

  return (
    <View
      style={[
        styles.container,
        {
          width: size * 1.5,
          height: size * 1.5,
          backgroundColor: `${color}20`,
          borderRadius: size * 0.75,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
