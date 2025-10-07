import React, { useState, useEffect } from 'react';
import { API_KEY, BASE_URL } from '@env';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  LogBox, 
  SafeAreaView, 
  Image 
} from 'react-native';
import axios from 'axios';

// Suppress deprecated warnings
LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

// Define Base URL for image assets
const IMAGE_BASE_URL = 'https://cis.kku.ac.th';

// Define a clean color palette (Consistent with Dashboard)
const COLORS = {
  primary: '#4f46e5', // Indigo 600
  danger: '#ef4444',  // Red 500
  background: '#f9fafb', // Light Gray background
  card: '#ffffff', // White card
  text: '#1f2937', // Gray 900
  subText: '#6b7280', // Gray 500
  border: '#e5e7eb', // Gray 200
};

// Axios instance for native environment
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

const ClassMembersScreen = ({ route, navigation }) => {
  const { token, year = '2565' } = route.params; 
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassMembers();
  }, [year]);

  const fetchClassMembers = async () => {
    setLoading(true);
    setError('');

    try {
      console.log(`Fetching class members for year ${year}`);

      const response = await api.get(`/class/${year}`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status !== 200 || !response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response structure - expected array of members');
      }

      setMembers(response.data.data);
    } catch (err) {
      console.error('Fetch Members Error:', err.response?.data || err.message);

      let errorMessage = 'Failed to fetch class members';
      if (err.response?.status === 401) {
        errorMessage = 'Unauthorized. Token may have expired. Please log in again.';
        Alert.alert('Session Expired', errorMessage, [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else if (err.response?.status === 404) {
        errorMessage = `No members found for year ${year}.`;
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network')) {
        errorMessage = 'Network error. Ensure you are on KKU Wi-Fi or VPN.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Server may be slow or unreachable.';
      } else {
        errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred';
      }

      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }) => {
    const imageUrl = item?.image ? `${IMAGE_BASE_URL}${item.image}` : null;
    const firstName = item?.firstname ?? '';
    const lastName = item?.lastname ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || 'ไม่ระบุชื่อ';

    return (
      <View style={styles.memberCard}>
        <View style={styles.cardHeader}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.profileImage}
              onError={(e) => console.log('Image Load Error:', e.nativeEvent.error)}
            />
          ) : (
            <Text style={styles.memberIcon}>👤</Text>
          )}

          <Text style={styles.cardTitle}>{fullName}</Text>
        </View>

        <Text style={styles.cardDetail}>Email: {item?.email || 'N/A'}</Text>
        <Text style={styles.cardDetail}>
          รหัสนิสิต: {item?.education?.studentId || 'N/A'}
        </Text>
        <Text style={styles.cardDetail}>
          ปีที่เข้าศึกษา: {item?.education?.enrollmentYear || 'N/A'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>รายชื่อเพื่อนร่วมชั้น</Text>
        <Text style={styles.subTitle}>รุ่นปีการศึกษา {year}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>ไม่พบสมาชิกในรุ่นปี {year}</Text>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item, index) => item?._id || index.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '700',
    fontFamily: 'NotoSansThai',
  },
  subTitle: {
    fontSize: 16,
    color: COLORS.subText,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    fontFamily: 'NotoSansThai',
  },
  memberCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    fontFamily: 'NotoSansThai',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: COLORS.border,
    resizeMode: 'cover',
  },
  memberIcon: {
    fontSize: 20,
    marginRight: 10,
    color: COLORS.primary,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'NotoSansThai',
  },
  cardDetail: {
    fontSize: 13,
    color: COLORS.subText,
    fontFamily: 'NotoSansThai',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.subText,
    textAlign: 'center',
    marginTop: 20,
  },
  loader: {
    marginTop: 30,
  },
  list: {
    paddingBottom: 20,
  },
});

export default ClassMembersScreen;
