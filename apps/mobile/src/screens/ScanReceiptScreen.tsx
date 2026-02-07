import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import apiService from '../services/api';
import { OcrResult } from '../types';

export const ScanReceiptScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editMode, setEditMode] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(t('common.error'), t('scan.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0]);
    }
  };

  const chooseFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert(t('common.error'), t('scan.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0]);
    }
  };

  const processImage = async (imageAsset: any) => {
    setUploading(true);
    setProcessing(true);

    try {
      const uploadResult = await apiService.uploadReceipt(
        {
          uri: imageAsset.uri,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        },
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
        }
      );

      setOcrResult({
        merchant: uploadResult.merchant,
        amount: uploadResult.amount,
        date: uploadResult.date,
        category: uploadResult.category,
        confidence: uploadResult.confidence,
      });

      setEditMode(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('scan.scanFailed'));
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!ocrResult) return;

    try {
      await apiService.createTransaction({
        type: 'expense',
        amount: ocrResult.amount,
        merchant: ocrResult.merchant,
        category: ocrResult.category,
        date: ocrResult.date,
        receiptUrl: image,
      });

      Alert.alert(t('common.confirm'), t('scan.scanSuccess'), [
        { text: t('common.confirm'), onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    }
  };

  if (!image) {
    return (
      <View style={styles.container}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{t('scan.title')}</Text>
          <Text style={styles.emoji}>📸</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
            <Text style={styles.primaryButtonText}>{t('scan.takePhoto')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={chooseFromGallery}>
            <Text style={styles.secondaryButtonText}>{t('scan.chooseFromGallery')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>
              {uploading ? t('scan.uploadProgress') : t('scan.processing')}
            </Text>
          </View>
        )}
      </View>

      {ocrResult && editMode && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>{t('scan.extractedData')}</Text>

          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>{t('scan.aiConfidence')}</Text>
            <Text style={styles.confidenceValue}>
              {((ocrResult.confidence || 0) * 100).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('scan.merchant')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={ocrResult.merchant}
              onChangeText={(text) => setOcrResult({ ...ocrResult, merchant: text })}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('scan.amount')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={ocrResult.amount?.toString()}
              onChangeText={(text) =>
                setOcrResult({ ...ocrResult, amount: parseFloat(text) || 0 })
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('scan.category')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={ocrResult.category}
              onChangeText={(text) => setOcrResult({ ...ocrResult, category: text })}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('scan.date')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={ocrResult.date}
              onChangeText={(text) => setOcrResult({ ...ocrResult, date: text })}
            />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setImage(null);
                setOcrResult(null);
                setEditMode(false);
              }}
            >
              <Text style={styles.retakeButtonText}>{t('scan.retake')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t('scan.confirmAndSave')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  instructionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 80,
  },
  buttonsContainer: {
    padding: 24,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  resultContainer: {
    padding: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  retakeButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
