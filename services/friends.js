import { db } from './firebase';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export async function addFriend(currentUserId, username) {
  try {
    if (!currentUserId || !username) {
      return { success: false, error: 'User ID and username are required' };
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRef = doc(db, 'usernames', cleanUsername);
    const usernameSnap = await getDoc(usernameRef);

    if (!usernameSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const friendUid = usernameSnap.data()?.uid;
    if (!friendUid) {
      return { success: false, error: 'User not found' };
    }

    if (friendUid === currentUserId) {
      return { success: false, error: 'Cannot add yourself as a friend' };
    }

    const currentUserRef = doc(db, 'users', currentUserId);
    const friendUserRef = doc(db, 'users', friendUid);

    await updateDoc(currentUserRef, {
      friends: arrayUnion(friendUid)
    });

    await updateDoc(friendUserRef, {
      friends: arrayUnion(currentUserId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding friend:', error);
    return { success: false, error: error.message || 'Failed to add friend' };
  }
}

export async function getFriends(userId) {
  try {
    if (!userId) return [];

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];

    const friendUids = userSnap.data()?.friends || [];
    if (!Array.isArray(friendUids) || friendUids.length === 0) {
      return [];
    }

    const friendDocs = await Promise.all(
      friendUids.map(async (friendId) => {
        const friendSnap = await getDoc(doc(db, 'users', friendId));
        if (friendSnap.exists()) {
          return { uid: friendSnap.id, id: friendSnap.id, ...friendSnap.data() };
        }
        return null;
      })
    );

    return friendDocs.filter(Boolean);
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
}

export async function removeFriend(currentUserId, friendId) {
  try {
    if (!currentUserId || !friendId) {
      return { success: false, error: 'Both user IDs are required' };
    }

    const currentUserRef = doc(db, 'users', currentUserId);
    const friendUserRef = doc(db, 'users', friendId);

    await updateDoc(currentUserRef, {
      friends: arrayRemove(friendId)
    });

    await updateDoc(friendUserRef, {
      friends: arrayRemove(currentUserId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message || 'Failed to remove friend' };
  }
}
