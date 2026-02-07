import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../../navigation/MainTabNavigator';
import { useScanReceipt } from '../../hooks/useScanReceipt';

type ScanReceiptScreenNavigationProp = NativeStackNavigationProp<
  ScanStackParamList,
  'ScanReceipt'
>;

const ScanReceiptScreen = () => {
  const navigation = useNavigation<ScanReceiptScreenNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const { scan, isScanning } = useScanReceipt();

  useEffect(() => {
    requestPermission();
  }, []);

  const handleTakePicture = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
      });
      if (photo) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  const handleScan = () => {
    if (!capturedImage) return;

    scan(capturedImage, {
      onSuccess: (data) => {
        navigation.navigate('ReceiptResult', { receiptId: data.receipt.id });
      },
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>카메라 권한을 확인하는 중...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text variant="titleMedium" style={styles.permissionText}>
          카메라 권한이 필요합니다
        </Text>
        <Button mode="contained" onPress={requestPermission} style={styles.button}>
          권한 허용
        </Button>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        <View style={styles.previewActions}>
          <Button
            mode="outlined"
            onPress={handleRetake}
            disabled={isScanning}
            style={styles.actionButton}
          >
            다시 찍기
          </Button>
          <Button
            mode="contained"
            onPress={handleScan}
            loading={isScanning}
            disabled={isScanning}
            style={styles.actionButton}
          >
            스캔하기
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={(ref) => setCameraRef(ref)}
        facing="back"
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.targetArea} />
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text variant="bodyMedium" style={styles.instructionText}>
              영수증을 프레임 안에 맞춰주세요
            </Text>
          </View>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <IconButton
          icon="image"
          size={32}
          iconColor="#FFFFFF"
          onPress={handlePickImage}
        />
        <IconButton
          icon="camera"
          size={64}
          iconColor="#FFFFFF"
          containerColor="#2E7D32"
          onPress={handleTakePicture}
          style={styles.captureButton}
        />
        <View style={{ width: 48 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 150,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 400,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  targetArea: {
    width: 300,
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 8,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  captureButton: {
    elevation: 8,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: '#1C1B1F',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});

export default ScanReceiptScreen;
