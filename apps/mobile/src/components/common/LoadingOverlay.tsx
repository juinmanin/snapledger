import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal, Surface, Text } from 'react-native-paper';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = '로딩 중...',
}) => {
  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.container}>
        <Surface style={styles.surface} elevation={4}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.text}>
            {message}
          </Text>
        </Surface>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  surface: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  text: {
    marginTop: 16,
  },
});
