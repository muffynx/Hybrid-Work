import React, { useState, useEffect } from 'react';
import { API_KEY, BASE_URL } from '@env';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  LogBox,
} from 'react-native';
import axios from 'axios';

LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

const COLORS = {
  primary: '#4f46e5',
  danger: '#ef4444',
  background: '#f3f4f6',
  card: '#ffffff',
  text: '#1f2937',
  subText: '#6b7280',
  border: '#d1d5db',
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const generateYearOptions = () => {
  const currentBuddhistYear = new Date().getFullYear() + 543;
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push((currentBuddhistYear - i).toString());
  }
  return years;
};

const YEAR_OPTIONS = generateYearOptions();
const DEFAULT_YEAR = YEAR_OPTIONS[0];

const DashboardScreen = ({ route, navigation }) => {
  const { token, user } = route.params;
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [year]);

  const fetchMembers = async (retry = false) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/class/${year}`, {
        headers: {
          accept: 'application/json',
          'x-api-key': API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 && Array.isArray(response.data?.data)) {
        setMembers(response.data.data);
      } else {
        setMembers([]);
        throw new Error('Invalid data format from API or empty data');
      }
    } catch (err) {
      console.error('❌ Fetch Members Error:', err.message);
      let message = 'ไม่สามารถโหลดรายชื่อสมาชิกได้';

      if (err.response?.status === 401) {
        message = 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่';
        Alert.alert('Token Expired', message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        message = 'การเชื่อมต่อล้มเหลว (timeout)';
      } else if (err.message.includes('Network')) {
        message = 'กรุณาเชื่อมต่อ KKU Wi-Fi หรือ VPN แล้วลองใหม่';
      } else if (!retry) {
        return fetchMembers(true);
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'คุณต้องการออกจากระบบหรือไม่?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
      },
    ]);
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberListItem}>
      <Text style={styles.memberIcon}>🧑‍🎓</Text>
      <View style={styles.memberDetails}>
        <Text style={styles.memberListTitle}>
          {item.firstname || '-'} {item.lastname || ''}
        </Text>
        <Text style={styles.memberListSubText}>
          รหัสนักศึกษา: {item.education?.studentId || 'ไม่ระบุ'}
        </Text>
      </View>
    </View>
  );

  const renderYearSelector = () => {
    const row1 = YEAR_OPTIONS.slice(0, 3);
    const row2 = YEAR_OPTIONS.slice(3);

    return (
      <View style={styles.yearSelectorCard}>
        <View style={styles.yearSelectorHeader}>
          <Text style={styles.yearSelectorIcon}>🗓️</Text>
          <Text style={styles.yearSelectorTitle}>ปีการศึกษา</Text>
        </View>

        <View style={styles.yearButtonRow}>
          {row1.map(y => (
            <TouchableOpacity
              key={y}
              style={[styles.yearButton, year === y && styles.yearButtonActive]}
              onPress={() => setYear(y)}
            >
              <Text style={[styles.yearButtonText, year === y && styles.yearButtonTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {row2.length > 0 && (
          <View style={styles.yearButtonRow}>
            {row2.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.yearButton, year === y && styles.yearButtonActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.yearButtonText, year === y && styles.yearButtonTextActive]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.welcomeTitle}>ยินดีต้อนรับ, {user.firstname}</Text>
          <Text style={styles.userInfoText}>Email: {user.email}</Text>
          <Text style={styles.userInfoText}>
            Role: {user.role} ({user.type})
          </Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('Posts', { token, user })}
          >
            <Text style={styles.primaryButtonText}>💬 โพสต์สถานะ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('ClassMembers', { token, year })}
          >
            <Text style={styles.secondaryButtonText}>👥 สมาชิกทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        {renderYearSelector()}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>ไม่พบข้อมูลนักศึกษาชั้นปี {year}</Text>
        ) : (
          <>
            <Text style={styles.listTitle}>จำนวนนักศึกษาชั้นปี {year}: {members.length} คน</Text>
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item, index) => item._id || index.toString()}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  headerCard: {
    backgroundColor: COLORS.card,
    padding: 25,
    borderRadius: 16,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeTitle: { fontSize: 24, color: COLORS.primary, marginBottom: 8, fontFamily: 'NotoSansThai', fontWeight: '800' },
  userInfoText: { fontSize: 14, color: COLORS.subText, marginBottom: 4, fontFamily: 'NotoSansThai' },
  logoutButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
    width: '70%',
  },
  logoutButtonText: { color: '#fff', fontSize: 16, textAlign: 'center', fontFamily: 'NotoSansThai', fontWeight: '700' },

  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginHorizontal: -5,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15, fontFamily: 'NotoSansThai' },
  secondaryButton: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1 },
  secondaryButtonText: { color: COLORS.primary, fontWeight: '700', fontSize: 15, fontFamily: 'NotoSansThai' },

  yearSelectorCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yearSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  yearSelectorIcon: { fontSize: 20, marginRight: 10 },
  yearSelectorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, fontFamily: 'NotoSansThai' },
  yearButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginHorizontal: -5 },
  yearButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'NotoSansThai',
  },
  yearButtonTextActive: {
    color: COLORS.card,
    fontWeight: '700',
    fontFamily: 'NotoSansThai',
  },

  listTitle: { fontSize: 15, color: COLORS.subText, marginBottom: 10, textAlign: 'left', fontWeight: '600', paddingHorizontal: 5, fontFamily: 'NotoSansThai' },
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberIcon: { fontSize: 24, marginRight: 15 },
  memberDetails: { flex: 1 },
  memberListTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: 'NotoSansThai' },
  memberListSubText: { fontSize: 13, color: COLORS.subText, marginTop: 2, fontFamily: 'NotoSansThai' },

  loader: { marginTop: 30 },
  errorText: { fontSize: 16, color: COLORS.danger, textAlign: 'center', marginTop: 30, fontWeight: '600', fontFamily: 'NotoSansThai' },
  emptyText: { fontSize: 16, color: COLORS.subText, textAlign: 'center', marginTop: 30, fontFamily: 'NotoSansThai' },
  list: { paddingBottom: 10 },
});

export default DashboardScreen;
