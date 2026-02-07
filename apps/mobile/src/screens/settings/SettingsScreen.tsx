import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Switch, Divider, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { useUserStore } from '../../stores/userStore';
import { useAuth } from '../../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const { user, updateUserMode, setActiveBusinessId } = useUserStore();
  const { logout } = useAuth();
  const [businessDialogVisible, setBusinessDialogVisible] = useState(false);
  const [businessName, setBusinessName] = useState('');

  const handleModeSwitch = () => {
    const newMode = user?.userMode === 'personal' ? 'business' : 'personal';
    
    if (newMode === 'business' && !user?.activeBusinessId) {
      setBusinessDialogVisible(true);
    } else {
      updateUserMode(newMode);
    }
  };

  const handleBusinessSetup = () => {
    // In a real app, this would create a business and set it as active
    // For now, we'll just close the dialog
    setBusinessDialogVisible(false);
    updateUserMode('business');
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          설정
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account-circle" size={64} color="#2E7D32" />
            </View>
            <Text variant="titleLarge" style={styles.userName}>
              {user?.name}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {user?.email}
            </Text>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              계정 설정
            </Text>

            <List.Item
              title="사용자 모드"
              description={user?.userMode === 'personal' ? '개인' : '사업자'}
              left={(props) => <List.Icon {...props} icon="account-switch" />}
              right={() => (
                <Switch
                  value={user?.userMode === 'business'}
                  onValueChange={handleModeSwitch}
                />
              )}
            />

            {user?.userMode === 'business' && (
              <>
                <Divider />
                <List.Item
                  title="사업자 정보"
                  description={user?.activeBusinessId ? '설정됨' : '미설정'}
                  left={(props) => <List.Icon {...props} icon="briefcase" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => setBusinessDialogVisible(true)}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              앱 설정
            </Text>

            <List.Item
              title="알림"
              description="예산 초과 알림 등"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />

            <Divider />

            <List.Item
              title="테마"
              description="라이트 모드"
              left={(props) => <List.Icon {...props} icon="palette" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />

            <Divider />

            <List.Item
              title="언어"
              description="한국어"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </Card.Content>
        </Card>

        {/* About */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              정보
            </Text>

            <List.Item
              title="버전"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />

            <Divider />

            <List.Item
              title="이용약관"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />

            <Divider />

            <List.Item
              title="개인정보처리방침"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#D32F2F"
          icon="logout"
        >
          로그아웃
        </Button>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            SnapLedger © 2024
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={businessDialogVisible}
          onDismiss={() => setBusinessDialogVisible(false)}
        >
          <Dialog.Title>사업자 정보 설정</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="사업자명"
              value={businessName}
              onChangeText={setBusinessName}
              mode="outlined"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBusinessDialogVisible(false)}>취소</Button>
            <Button onPress={handleBusinessSetup} disabled={!businessName}>
              저장
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1C1B1F',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#49454F',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: '#79747E',
  },
  input: {
    marginBottom: 8,
  },
});

export default SettingsScreen;
