import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/formatDate';
import apiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  React.useEffect(() => {
    loadLastBackupTime();
  }, []);

  const loadLastBackupTime = async () => {
    try {
      const timestamp = await AsyncStorage.getItem('lastBackupTime');
      setLastBackup(timestamp);
    } catch (error) {
      console.error('Failed to load last backup time:', error);
    }
  };

  const handleLanguageChange = async (language: 'ko' | 'en' | 'ms' | 'zh') => {
    try {
      await i18n.changeLanguage(language);
      if (user) {
        const updatedUser = { ...user, language };
        await apiService.updateProfile({ language });
        updateUser(updatedUser);
      }
      Alert.alert(t('common.confirm'), t('settings.changeLanguage'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleCurrencyChange = async (currency: 'KRW' | 'USD' | 'MYR' | 'CNY') => {
    try {
      if (user) {
        const updatedUser = { ...user, currency };
        await apiService.updateProfile({ currency });
        updateUser(updatedUser);
      }
      Alert.alert(t('common.confirm'), t('settings.changeCurrency'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleModeChange = async (mode: 'personal' | 'business') => {
    try {
      if (user) {
        const updatedUser = { ...user, mode };
        await apiService.updateProfile({ mode });
        updateUser(updatedUser);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleBackupToGoogleDrive = async () => {
    Alert.alert(
      t('settings.backupToGoogleDrive'),
      t('common.confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setLoading(true);
            try {
              await apiService.backupToGoogleDrive();
              const now = new Date().toISOString();
              await AsyncStorage.setItem('lastBackupTime', now);
              setLastBackup(now);
              Alert.alert(t('common.confirm'), t('settings.backupSuccess'));
            } catch (error: any) {
              Alert.alert(
                t('common.error'),
                error.message || t('settings.backupFailed')
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRestoreFromGoogleDrive = async () => {
    setLoading(true);
    try {
      const backups = await apiService.getBackupList();
      
      if (backups.length === 0) {
        Alert.alert(t('common.error'), t('settings.neverBackedUp'));
        return;
      }

      Alert.alert(
        t('settings.restoreFromGoogleDrive'),
        `${t('settings.selectBackup')}: ${backups[0].timestamp}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: async () => {
              try {
                await apiService.restoreFromGoogleDrive(backups[0].id);
                Alert.alert(t('common.confirm'), t('settings.restoreSuccess'));
              } catch (error: any) {
                Alert.alert(
                  t('common.error'),
                  error.message || t('settings.restoreFailed')
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderLanguageOption = (lang: 'ko' | 'en' | 'ms' | 'zh') => (
    <TouchableOpacity
      key={lang}
      style={[
        styles.optionButton,
        i18n.language === lang && styles.activeOptionButton,
      ]}
      onPress={() => handleLanguageChange(lang)}
    >
      <Text
        style={[
          styles.optionButtonText,
          i18n.language === lang && styles.activeOptionButtonText,
        ]}
      >
        {t(`languages.${lang}`)}
      </Text>
    </TouchableOpacity>
  );

  const renderCurrencyOption = (curr: 'KRW' | 'USD' | 'MYR' | 'CNY') => (
    <TouchableOpacity
      key={curr}
      style={[
        styles.optionButton,
        user?.currency === curr && styles.activeOptionButton,
      ]}
      onPress={() => handleCurrencyChange(curr)}
    >
      <Text
        style={[
          styles.optionButtonText,
          user?.currency === curr && styles.activeOptionButtonText,
        ]}
      >
        {t(`currencies.${curr}`)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('settings.mode')}</Text>
          <View style={styles.modeSwitch}>
            <Text
              style={[
                styles.modeSwitchText,
                user?.mode === 'personal' && styles.activeModeText,
              ]}
            >
              {t('settings.personal')}
            </Text>
            <Switch
              value={user?.mode === 'business'}
              onValueChange={(value) =>
                handleModeChange(value ? 'business' : 'personal')
              }
              trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
              thumbColor="#fff"
            />
            <Text
              style={[
                styles.modeSwitchText,
                user?.mode === 'business' && styles.activeModeText,
              ]}
            >
              {t('settings.business')}
            </Text>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('settings.language')}</Text>
          <View style={styles.optionGrid}>
            {renderLanguageOption('ko')}
            {renderLanguageOption('en')}
            {renderLanguageOption('ms')}
            {renderLanguageOption('zh')}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('settings.currency')}</Text>
          <View style={styles.optionGrid}>
            {renderCurrencyOption('KRW')}
            {renderCurrencyOption('USD')}
            {renderCurrencyOption('MYR')}
            {renderCurrencyOption('CNY')}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.backup')}</Text>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabledButton]}
          onPress={handleBackupToGoogleDrive}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#2196F3" />
          ) : (
            <>
              <Text style={styles.actionButtonText}>
                {t('settings.backupToGoogleDrive')}
              </Text>
              <Text style={styles.actionButtonIcon}>☁️</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabledButton]}
          onPress={handleRestoreFromGoogleDrive}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>
            {t('settings.restoreFromGoogleDrive')}
          </Text>
          <Text style={styles.actionButtonIcon}>📥</Text>
        </TouchableOpacity>

        <View style={styles.lastBackupContainer}>
          <Text style={styles.lastBackupLabel}>{t('settings.lastBackup')}:</Text>
          <Text style={styles.lastBackupValue}>
            {lastBackup
              ? formatDateTime(lastBackup, i18n.language)
              : t('settings.neverBackedUp')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('settings.version')}</Text>
          <Text style={styles.infoValue}>2.0.0</Text>
        </View>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkButtonText}>{t('settings.privacyPolicy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkButtonText}>{t('settings.termsOfService')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkButtonText}>{t('settings.support')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileSection: {
    backgroundColor: '#2196F3',
    padding: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeSwitchText: {
    fontSize: 16,
    color: '#999',
  },
  activeModeText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  activeOptionButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeOptionButtonText: {
    color: '#2196F3',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  disabledButton: {
    borderColor: '#BDBDBD',
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  actionButtonIcon: {
    fontSize: 24,
  },
  lastBackupContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  lastBackupLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastBackupValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    height: 32,
  },
});
