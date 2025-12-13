import { ref, update, get, push } from 'firebase/database';
import { rtdb } from '../api/firebase';

/**
 * İki kullanıcı arasında arkadaş ilişkisini kontrol et
 */
export async function areFriends(userId1, userId2) {
  if (!userId1 || !userId2 || userId1 === userId2) return false;
  
  try {
    const friendsRef = ref(rtdb, `users/${userId1}/friends/${userId2}`);
    const snapshot = await get(friendsRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Arkadaş kontrolü hatası:', error);
    return false;
  }
}

/**
 * Arkadaş ekle (çift yönlü)
 */
export async function addFriend(userId, friendId) {
  if (!userId || !friendId || userId === friendId) return false;
  
  try {
    // Her iki yönde de arkadaş ekle
    await update(ref(rtdb, `users/${userId}/friends`), {
      [friendId]: true
    });
    
    await update(ref(rtdb, `users/${friendId}/friends`), {
      [userId]: true
    });
    
    return true;
  } catch (error) {
    console.error('Arkadaş ekleme hatası:', error);
    return false;
  }
}

/**
 * Arkadaş sil (çift yönlü)
 */
export async function removeFriend(userId, friendId) {
  if (!userId || !friendId || userId === friendId) return false;
  
  try {
    // Her iki yönde de arkadaşlığı sil
    await update(ref(rtdb, `users/${userId}/friends`), {
      [friendId]: null
    });
    
    await update(ref(rtdb, `users/${friendId}/friends`), {
      [userId]: null
    });
    
    return true;
  } catch (error) {
    console.error('Arkadaş silme hatası:', error);
    return false;
  }
}

/**
 * Özel sohbet ID'si oluştur (deterministic - sıra önemli değil)
 */
export function createConversationId(userId1, userId2) {
  if (!userId1 || !userId2 || userId1 === userId2) return null;
  const sorted = [userId1, userId2].sort();
  return sorted.join('_');
}

/**
 * Özel sohbet oluştur (arkadaşlar arasında)
 */
export async function createPrivateConversation(userId, friendId) {
  if (!userId || !friendId || userId === friendId) return null;
  
  // Önce arkadaş olduğunu kontrol et
  const isFriend = await areFriends(userId, friendId);
  if (!isFriend) {
    console.error('Kullanıcılar arkadaş değil');
    return null;
  }
  
  const conversationId = createConversationId(userId, friendId);
  
  try {
    // Sohbeti oluştur veya varolan sohbeti döndür
    await update(ref(rtdb, `chat/private/${conversationId}`), {
      [`participants/${userId}`]: true,
      [`participants/${friendId}`]: true,
      createdAt: new Date().toISOString()
    });
    
    // Her iki user'ın conversationIds'ine ekle
    await update(ref(rtdb, `users/${userId}/conversations`), {
      [conversationId]: true
    });
    
    await update(ref(rtdb, `users/${friendId}/conversations`), {
      [conversationId]: true
    });
    
    return conversationId;
  } catch (error) {
    console.error('Sohbet oluşturma hatası:', error);
    return null;
  }
}

/**
 * Kullanıcının tüm arkadaşlarını getir
 */
export async function getUserFriends(userId) {
  if (!userId) return [];
  
  try {
    const friendsRef = ref(rtdb, `users/${userId}/friends`);
    const snapshot = await get(friendsRef);
    
    if (!snapshot.exists()) return [];
    
    const friendsData = snapshot.val();
    return Object.keys(friendsData).filter(key => friendsData[key] === true);
  } catch (error) {
    console.error('Arkadaş listesi getirme hatası:', error);
    return [];
  }
}

/**
 * Kullanıcının tüm sohbetlerini getir
 */
export async function getUserConversations(userId) {
  if (!userId) return [];
  
  try {
    const conversationsRef = ref(rtdb, `users/${userId}/conversations`);
    const snapshot = await get(conversationsRef);
    
    if (!snapshot.exists()) return [];
    
    const conversationsData = snapshot.val();
    return Object.keys(conversationsData).filter(key => conversationsData[key] === true);
  } catch (error) {
    console.error('Sohbet listesi getirme hatası:', error);
    return [];
  }
}
