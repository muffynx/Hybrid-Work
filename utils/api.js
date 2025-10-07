import axios from 'axios';
import { Alert } from 'react-native';
import { API_KEY, BASE_URL } from '@env'; // ✅ import จาก env

export const colors = {
    primary: '#4f46e5', 
    secondary: '#10b981', 
    danger: '#ef4444', 
    background: '#f8fafc', 
    card: '#ffffff', 
    textPrimary: '#1f2937', 
    textSecondary: '#6b7280', 
    border: '#e5e7eb', 
    like: '#fb7185', 
};

// Axios instance for native environment
export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

/**
 * Global function for performing API actions (POST, DELETE)
 * @param {string} path - API endpoint path (e.g., '/like', '/status/id')
 * @param {string} method - HTTP method (e.g., 'POST', 'DELETE')
 * @param {object|null} data - Request body data
 * @param {string} token - Authorization token
 * @param {object} callbacks - Object containing callback functions
 * @returns {Promise<void>}
 */
export const apiAction = async (path, method = 'POST', data = null, token, { setLoading, handleError, successMessage, userId, setPosts, fetchPosts }) => {
    setLoading(true);

    try {
        const config = {
            method,
            url: path,
            headers: {
                'accept': 'application/json',
                'x-api-key': API_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            data: data ? JSON.stringify(data) : undefined,
        };

        const response = await api.request(config);

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Server returned status ${response.status}`);
        }
        if (response.data.error) {
            throw new Error(response.data.error);
        }

        Alert.alert('สำเร็จ', successMessage);


        if (path === '/like' || path === '/unlike') {
            const updatedPost = response.data.data;
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post._id === updatedPost._id
                        ? {
                            ...post,
                            likeCount: updatedPost.likeCount ?? updatedPost.like?.length ?? 0,
                            hasLiked: updatedPost.hasLiked ?? updatedPost.like?.some(like =>
                                (typeof like === 'string' && like === userId) || (like?._id === userId)
                            ) ?? false,
                            like: updatedPost.like,
                        }
                        : post
                )
            );
        }


        if (fetchPosts && path !== '/like' && path !== '/unlike') {
            fetchPosts();
        }

    } catch (err) {
        handleError(err);
    } finally {
        setLoading(false);
    }
};