import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, LogBox } from 'react-native';
import axios from 'axios';
import { API_KEY, BASE_URL } from '@env'; 

LogBox.ignoreLogs(['props.pointerEvents is deprecated']);


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    accept: 'application/json',
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('natdanai.pa@kkumail.com');
  const [password, setPassword] = useState('..');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/signin', { email, password });

      if (response.status !== 200) throw new Error(`Server returned status ${response.status}`);
      if (!response.data?.data) throw new Error('Invalid response structure - missing data field');

      const userData = response.data.data;

      if (!userData.token || !userData._id || !userData.email)
        throw new Error('Missing required user data or token');

      navigation.navigate('Dashboard', { token: userData.token, user: userData });
    } catch (err) {
      console.error('Login Error:', err);
      let errorMessage = 'Login failed';
      if (err.response?.status === 401)
        errorMessage = 'Invalid credentials. Please check your email or password.';
      else if (err.response?.status === 404)
        errorMessage = 'User not found. Please check your email.';
      else if (err.response?.status === 500)
        errorMessage = 'Server error. Please try again later.';
      else if (err.code === 'ECONNREFUSED' || err.message.includes('Network'))
        errorMessage = 'Network error. Ensure you are on KKU Wi-Fi or VPN.';
      else if (err.message.includes('timeout'))
        errorMessage = 'Request timeout. Server may be slow or unreachable.';
      else errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred';

      setError(errorMessage);
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to Classroom Portal</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
        editable={!loading}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontFamily: 'NotoSansThai', fontSize: 24, marginBottom: 24, color: '#333' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 16, borderRadius: 8, fontFamily: 'NotoSansThai', fontSize: 16 },
  errorText: { color: '#e63946', marginBottom: 16, fontFamily: 'NotoSansThai', textAlign: 'center' },
  button: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontFamily: 'NotoSansThai', fontSize: 16 },
});

export default LoginScreen;
