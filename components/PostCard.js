import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../utils/api'; 

const PostCard = React.memo(({ post, userId, userCache, onLike, onUnlike, onComment, onDeletePost, onDeleteComment }) => {
  const [comment, setComment] = useState('');

 
  const getFullName = (person) => {
    if (typeof person === 'object' && person !== null) {
      const name = `${person.firstname ?? person.name ?? ''} ${person.lastname ?? ''}`.trim();
      if (name) return name;
      return person.email ? person.email.split('@')[0] : person._id ? person._id.slice(0, 8) + '...' : 'Unknown User';
    }
    if (typeof person === 'string' && userCache[person]) {
      const cachedUser = userCache[person];
      const name = `${cachedUser.firstname ?? cachedUser.name ?? ''} ${cachedUser.lastname ?? ''}`.trim();
      if (name) return name;
      return cachedUser.email ? cachedUser.email.split('@')[0] : person.slice(0, 8) + '...' || 'Unknown User';
    }
    return person ? person.slice(0, 8) + '...' : 'Unknown User';
  };

  const handleComment = () => {
    if (comment.trim()) {
      onComment(post._id, comment.trim());
      setComment('');
    }
  };

  const isOwnPost = post.createdBy === userId || (typeof post.createdBy === 'object' && post.createdBy._id === userId);
  const isLiked = post.hasLiked;
  const authorName = getFullName(post.createdBy);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{authorName[0] || 'U'}</Text>
        </View>
        <View>
          <Text style={styles.postAuthor}>{authorName}</Text>
          <Text style={styles.postMeta}>
            {new Date(post.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>
      </View>

      <Text style={styles.postText}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={isLiked ? () => onUnlike(post._id) : () => onLike(post._id)}
          style={[styles.likeButton, isLiked && styles.likedButton]}
        >
          <Text style={[styles.likeText, isLiked && {color: colors.card}]}> 
            <Text style={{ fontSize: 18 }}>{isLiked ? '💖' : '🤍'}</Text> {post.likeCount ?? 0}
          </Text>
        </TouchableOpacity>
        
        {isOwnPost && (
          <TouchableOpacity onPress={() => onDeletePost(post._id)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>🗑️ ลบโพสต์</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.commentTitle}>ความคิดเห็น ({post.comment?.length || 0})</Text>
        {post.comment?.map((item) => {
          const commentAuthor = getFullName(item.createdBy);
          const isOwnComment = item.createdBy === userId || (typeof item.createdBy === 'object' && item.createdBy._id === userId);
          
          return (
            <View key={item._id} style={styles.commentContainer}>
              <Text style={styles.commentText}>
                <Text style={styles.commentAuthorText}>{commentAuthor}: </Text>
                {item.content}
              </Text>
              {(isOwnComment || isOwnPost) && ( 
                <TouchableOpacity
                  onPress={() => onDeleteComment(post._id, item._id)}
                  style={styles.deleteCommentButton}
                >
                  <Text style={styles.deleteTextSmall}>ลบ</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="แสดงความคิดเห็น..."
            value={comment}
            onChangeText={setComment}
            placeholderTextColor="#9ca3af"
            multiline={true}
            maxHeight={40}
          />
          <TouchableOpacity 
            style={[styles.commentSubmitButton, !comment.trim() && styles.commentSubmitButtonDisabled]} 
            onPress={handleComment}
            disabled={!comment.trim()}
          >
            <Text style={styles.commentSubmitText}>ส่ง</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6 },
        android: { elevation: 6 },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
      paddingBottom: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    avatarText: {
      color: '#fff',
      fontSize: 18,
      fontFamily: 'NotoSansThai',
    },
    postAuthor: {
      fontSize: 16,
      color: colors.textPrimary,
      fontFamily: 'NotoSansThai',
    },
    postText: {
   
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 12,
      fontFamily: 'NotoSansThai',
    },
    postMeta: {
    
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'NotoSansThai',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    likeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    likedButton: {
      backgroundColor: colors.like,
      borderColor: colors.like,
    },
    likeText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginLeft: 4,
      fontFamily: 'NotoSansThai',
    },
    deleteButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#fee2e2',
    },
    deleteText: {

      fontSize: 14,
      color: colors.danger,
      fontFamily: 'NotoSansThai',
    },
    deleteTextSmall: {
      fontSize: 12,
      color: colors.danger,
      fontFamily: 'NotoSansThai',
    },
    commentSection: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    commentTitle: {
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 8,
      fontFamily: 'NotoSansThai',
    },
    commentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: '#f9fafb',
      padding: 8,
      borderRadius: 8,
      marginBottom: 6,
    },
    commentAuthorText: {
      color: colors.textPrimary,
    },
    commentText: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
      fontFamily: 'NotoSansThai',
    },
    deleteCommentButton: {
      padding: 4,
    },
    commentInputContainer: {
      flexDirection: 'row',
      marginTop: 8,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
      borderRadius: 8,
      marginRight: 8,
      fontSize: 14,
      backgroundColor: '#fff',
      fontFamily: 'NotoSansThai',
    },
    commentSubmitButton: {
      backgroundColor: colors.secondary,
      padding: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentSubmitButtonDisabled: {
      backgroundColor: '#6ee7b7',
    },
    commentSubmitText: {
      color: '#fff',
      fontSize: 14,
      fontFamily: 'NotoSansThai',
    },
});

export default PostCard;