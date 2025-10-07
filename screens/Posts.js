import { API_KEY, BASE_URL } from '@env'; 
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, LogBox, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';


import PostCard from '../components/PostCard'; // ⭐️ Import PostCard
import { api, apiAction, colors } from '../utils/api'; // ⭐️ Import api & apiAction from utils


LogBox.ignoreLogs(['props.pointerEvents is deprecated']);
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const PostsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { token, user } = route.params; 
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userCache, setUserCache] = useState({});
  const userId = user._id;

  const handleError = useCallback((err, defaultMessage) => {
    console.error('API Error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      url: err.config?.url,
    });

    let errorMessage = defaultMessage;
    if (err.response?.status === 401) {
      errorMessage = 'ไม่ได้รับอนุญาต. โทเคนหมดอายุ กรุณาเข้าสู่ระบบใหม่';
      Alert.alert('เซสชันหมดอายุ', errorMessage, [
        { text: 'ตกลง', onPress: () => navigation.navigate('Login') },
      ]);
    } else if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      errorMessage = 'การเชื่อมต่อหมดเวลา โปรดตรวจสอบเครือข่าย';
    } else {
      errorMessage = err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }

    setError(errorMessage);
    if (err.response?.status !== 401) {
      Alert.alert('ข้อผิดพลาด', errorMessage);
    }
  }, [navigation]);

  const fetchUser = useCallback(async (id) => {
    if (!id || typeof id !== 'string') return { _id: id, email: '', firstname: '', lastname: '', name: 'Invalid User' };
    if (userCache[id]) return userCache[id];

    try {
      const response = await api.get(`/user/${id}`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      const userData = response.data.data;
      setUserCache(prev => ({ ...prev, [id]: userData }));
      return userData;
    } catch (err) {
      const fallbackUser = { _id: id, email: '', firstname: '', lastname: '', name: 'Unknown User' };
      setUserCache(prev => ({ ...prev, [id]: fallbackUser }));
      return fallbackUser;
    }
  }, [token]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/status', {
        headers: {
          'accept': 'application/json',
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status !== 200 || !Array.isArray(response.data?.data)) {
        throw new Error('Invalid response structure or server error.');
      }

      const rawPosts = response.data.data;
      const sortedPosts = rawPosts
        .map(post => ({
          ...post,
          likeCount: post.likeCount ?? post.like?.length ?? 0,
          hasLiked: post.hasLiked ?? post.like?.some(like => 
            (typeof like === 'string' && like === userId) || (like?._id === userId)
          ) ?? false,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


      const userIds = new Set();
      sortedPosts.forEach(post => {
        if (typeof post.createdBy === 'string' && post.createdBy) userIds.add(post.createdBy);
        else if (post.createdBy?._id) userIds.add(post.createdBy._id);
        post.comment?.forEach(comment => {
          if (typeof comment.createdBy === 'string' && comment.createdBy) userIds.add(comment.createdBy);
          else if (comment.createdBy?._id) userIds.add(comment.createdBy._id);
        });
        post.like?.forEach(like => {
          if (typeof like === 'string' && like) userIds.add(like);
          else if (like?._id) userIds.add(like._id);
        });
      });


      const userPromises = Array.from(userIds).map(id => fetchUser(id));
      await Promise.all(userPromises);

      setPosts(sortedPosts);
    } catch (err) {
      handleError(err, 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [token, handleError, fetchUser, userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);


  const actionHandler = useCallback(async (path, method, data, successMsg, postId, commentId) => {
    const shouldUpdatePostState = path === '/like' || path === '/unlike';
    

    await apiAction(path, method, data, token, {
      setLoading,
      handleError: (err) => handleError(err, `Failed to perform action: ${path.split('/')[2] || path}`),
      successMessage: successMsg,
      userId,
      setPosts,
      fetchPosts: shouldUpdatePostState ? null : fetchPosts, // Only re-fetch if necessary
    });
  }, [token, userId, handleError, fetchPosts]);

  const createPost = () => {
    if (newPost.trim()) {
      actionHandler('/status', 'POST', { content: newPost.trim() }, 'โพสต์สำเร็จ!');
      setNewPost('');
    }
  };

  const deletePost = (postId) => {
    Alert.alert('ยืนยัน', 'คุณต้องการลบโพสต์นี้ใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', onPress: () => actionHandler(`/status/${postId}`, 'DELETE', null, 'ลบโพสต์สำเร็จ!'), style: 'destructive' },
    ]);
  };

  const likePost = (postId) => actionHandler('/like', 'POST', { statusId: postId }, 'กดถูกใจสำเร็จ!');
  const unlikePost = (postId) => actionHandler('/like', 'DELETE', { statusId: postId }, 'ยกเลิกถูกใจสำเร็จ!');
  const addComment = (postId, content) => actionHandler('/comment', 'POST', { content, statusId: postId }, 'คอมเมนต์สำเร็จ!');
  const deleteComment = (postId, commentId) => actionHandler(`/comment/${commentId}`, 'DELETE', { statusId: postId }, 'ลบคอมเมนต์สำเร็จ!');

  const renderListHeader = () => (
    <>
      <View style={styles.postInputCard}>
        <TextInput
          style={styles.input}
          placeholder="คุณกำลังคิดอะไรอยู่หรอ?"
          value={newPost}
          onChangeText={setNewPost}
          placeholderTextColor="#9ca3af"
          editable={!loading}
          multiline={true}
        />
        <TouchableOpacity
          style={[styles.button, styles.postButton, (!newPost.trim() || loading) && styles.buttonDisabled]}
          onPress={createPost}
          disabled={!newPost.trim() || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'กำลังโพสต์...' : 'โพสต์'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topActions}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.navigate('Dashboard', { token, user })}
        >
          <Text style={styles.buttonText}>กลับไปหน้าหลัก</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && posts.length === 0 && (
        <Text style={styles.emptyText}>ยังไม่มีโพสต์ให้แสดง</Text>
      )}
      
      {!loading && posts.length > 0 && (
        <Text style={styles.feedTitle}>โพสต์ล่าสุด</Text>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>กระดานข่าวสาร</Text>
        <Text style={styles.subText}>ยินดีต้อนรับ, {user.firstname} {user.lastname}</Text>
      </View>
      
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            userId={userId}
            userCache={userCache}
            onLike={likePost}
            onUnlike={unlikePost}
            onComment={addComment}
            onDeletePost={deletePost}
            onDeleteComment={deleteComment}
          />
        )}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContentContainer} 
      />
    </View>
  );
};


const styles = StyleSheet.create({
  // ... (Styles from original code remain here) ...
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  listContentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'NotoSansThai',
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'NotoSansThai',
  },
  postInputCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'NotoSansThai',
  },
  postButton: {
    alignSelf: 'flex-end',
    width: 120,
    backgroundColor: colors.primary,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
      android: { elevation: 3 },
    }),
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    ...Platform.select({ android: { elevation: 1 } }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NotoSansThai',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  feedTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    fontFamily: 'NotoSansThai',
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    fontFamily: 'NotoSansThai',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'NotoSansThai',
  },
 
});


export default PostsScreen;