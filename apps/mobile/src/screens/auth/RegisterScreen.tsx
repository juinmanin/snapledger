import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface, SegmentedButtons } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../hooks/useAuth';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [userMode, setUserMode] = useState<'personal' | 'business'>('personal');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isRegisterLoading } = useAuth();

  const handleRegister = () => {
    if (!email || !password || !name) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    const data = {
      email,
      password,
      name,
      userMode,
      ...(userMode === 'business' && businessName ? { businessName } : {}),
    };

    register(data);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            회원가입
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            SnapLedger에 오신 것을 환영합니다
          </Text>
        </View>

        <Surface style={styles.formContainer} elevation={2}>
          <SegmentedButtons
            value={userMode}
            onValueChange={(value) => setUserMode(value as 'personal' | 'business')}
            buttons={[
              { value: 'personal', label: '개인' },
              { value: 'business', label: '사업자' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="이름"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="이메일"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          {userMode === 'business' && (
            <TextInput
              label="사업자명"
              value={businessName}
              onChangeText={setBusinessName}
              mode="outlined"
              style={styles.input}
            />
          )}

          <TextInput
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          <TextInput
            label="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            error={confirmPassword !== '' && password !== confirmPassword}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isRegisterLoading}
            disabled={
              isRegisterLoading ||
              !email ||
              !password ||
              !name ||
              password !== confirmPassword
            }
            style={styles.button}
          >
            회원가입
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.textButton}
          >
            이미 계정이 있으신가요? 로그인
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#49454F',
  },
  formContainer: {
    padding: 24,
    borderRadius: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  textButton: {
    marginTop: 8,
  },
});

export default RegisterScreen;
