import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategoryIconProps {
  category: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 48 }) => {
  const getCategoryColor = (cat: string): string => {
    const colors: Record<string, string> = {
      food: '#FF6B6B',
      transport: '#4ECDC4',
      shopping: '#95E1D3',
      entertainment: '#F38181',
      utilities: '#AA96DA',
      healthcare: '#FCBAD3',
      education: '#FFFFD2',
      housing: '#A8D8EA',
      salary: '#4CAF50',
      business: '#2196F3',
      investment: '#9C27B0',
      other: '#757575',
    };
    return colors[cat] || colors.other;
  };

  const getCategoryEmoji = (cat: string): string => {
    const emojis: Record<string, string> = {
      food: '🍽️',
      transport: '🚗',
      shopping: '🛍️',
      entertainment: '🎮',
      utilities: '💡',
      healthcare: '⚕️',
      education: '📚',
      housing: '🏠',
      salary: '💰',
      business: '💼',
      investment: '📈',
      other: '📌',
    };
    return emojis[cat] || emojis.other;
  };

  const backgroundColor = getCategoryColor(category);
  const emoji = getCategoryEmoji(category);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor + '20',
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});
