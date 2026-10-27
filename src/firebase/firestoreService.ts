import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  limit,
  getCountFromServer,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, testConnection } from './config';

/**
 * Recursively removes any object keys that are undefined to prevent Firestore
 * "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}
import { 
  User, 
  Post, 
  Challenge, 
  ChallengeSubmission, 
  EventItem, 
  PrayerRequest, 
  Testimonial,
  SubmissionStatus,
  Church,
  Comment,
  ReactionRecord,
  Story,
  ChatMessage,
  Group,
  Badge,
  Achievement,
  NotificationItem,
  Report,
  OfficialSource,
  NewsItem,
  ChannelItem,
  Game,
  GameScore,
  PointTransaction,
  FriendInvitation,
  LiveStreamSession
} from '../types';
import { 
  INITIAL_POSTS, 
  INITIAL_CHALLENGES, 
  INITIAL_EVENTS, 
  INITIAL_PRAYER_REQUESTS, 
  INITIAL_TESTIMONIALS,
  INITIAL_CHURCHES,
  INITIAL_BADGES,
  OFFICIAL_SOURCES,
  INITIAL_CHANNELS,
  INITIAL_STORIES,
  ADMIN_USER
} from '../data/seedData';

// --- INITIALIZATION AND SEEDING FUNCTION ---
export async function initializeFirestoreData(): Promise<void> {
  try {
    // 0. Verify connection to Firestore at boot
    await testConnection();

    // 1. Seed Posts if empty
    const postsCol = collection(db, 'posts');
    const postsSnap = await getDocs(postsCol);
    if (postsSnap.empty) {
      for (const p of INITIAL_POSTS) {
        await setDoc(doc(db, 'posts', p.id), p);
      }
      console.log('Firestore: posts seeded.');
    }

    // 2. Seed Challenges if empty
    const challengesCol = collection(db, 'challenges');
    const challengesSnap = await getDocs(challengesCol);
    if (challengesSnap.empty) {
      for (const ch of INITIAL_CHALLENGES) {
        await setDoc(doc(db, 'challenges', ch.id), ch);
      }
      console.log('Firestore: challenges seeded.');
    }

    // 3. Seed Events
    const eventsCol = collection(db, 'events');
    const eventsSnap = await getDocs(eventsCol);
    const hasOldMock = eventsSnap.docs.some(d => d.id === 'ev_camporee' || d.id === 'ev_caleb' || !d.data().officialSourceName);
    if (eventsSnap.empty || hasOldMock) {
      for (const ev of INITIAL_EVENTS) {
        await setDoc(doc(db, 'events', ev.id), sanitizeForFirestore(ev));
      }
      for (const docSnap of eventsSnap.docs) {
        if (!INITIAL_EVENTS.some(e => e.id === docSnap.id)) {
          await deleteDoc(doc(db, 'events', docSnap.id)).catch(() => {});
        }
      }
      console.log('Firestore: events updated with verified official dataset.');
    }

    // 4. Seed Prayers if empty
    const prayersCol = collection(db, 'prayers');
    const prayersSnap = await getDocs(prayersCol);
    if (prayersSnap.empty) {
      for (const pr of INITIAL_PRAYER_REQUESTS) {
        await setDoc(doc(db, 'prayers', pr.id), pr);
      }
      console.log('Firestore: prayers seeded.');
    }

    // 5. Seed Testimonials if empty
    const testCol = collection(db, 'testimonials');
    const testSnap = await getDocs(testCol);
    if (testSnap.empty) {
      for (const t of INITIAL_TESTIMONIALS) {
        await setDoc(doc(db, 'testimonials', t.id), t);
      }
      console.log('Firestore: testimonials seeded.');
    }

    // 6. Seed Churches if empty
    const churchesCol = collection(db, 'churches');
    const churchesSnap = await getDocs(churchesCol);
    if (churchesSnap.empty) {
      for (const c of INITIAL_CHURCHES) {
        await setDoc(doc(db, 'churches', c.id), c);
      }
      console.log('Firestore: churches seeded.');
    }

    // 7. Seed Badges if empty
    const badgesCol = collection(db, 'badges');
    const badgesSnap = await getDocs(badgesCol);
    if (badgesSnap.empty) {
      for (const b of INITIAL_BADGES) {
        await setDoc(doc(db, 'badges', b.id), b);
      }
      console.log('Firestore: badges seeded.');
    }

    // 8. Seed Official Sources if empty
    const officialCol = collection(db, 'official_sources');
    const officialSnap = await getDocs(officialCol);
    if (officialSnap.empty) {
      for (const o of OFFICIAL_SOURCES) {
        await setDoc(doc(db, 'official_sources', o.id), o);
      }
      console.log('Firestore: official sources seeded.');
    }

    // 9. Seed Channels if empty
    const channelsCol = collection(db, 'channels');
    const channelsSnap = await getDocs(channelsCol);
    if (channelsSnap.empty) {
      for (const ch of INITIAL_CHANNELS) {
        await setDoc(doc(db, 'channels', ch.id), ch);
      }
      console.log('Firestore: channels seeded.');
    }

    // 10. Seed Initial Stories if empty
    const storiesCol = collection(db, 'stories');
    const storiesSnap = await getDocs(storiesCol);
    if (storiesSnap.empty) {
      for (const s of INITIAL_STORIES) {
        await setDoc(doc(db, 'stories', s.id), s);
      }
      console.log('Firestore: stories seeded.');
    }

    // 11. Seed Admin User profile if not exists
    const adminRef = doc(db, 'users', ADMIN_USER.id);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, ADMIN_USER);
    }
  } catch (error) {
    console.warn('Initial seeding could not connect or permission pending, using local cache:', error);
  }
}

// ============================================================================
// 1. USERS CRUD
// ============================================================================
export async function saveUserToFirestore(user: User): Promise<void> {
  const targetId = user.id || auth.currentUser?.uid;
  if (!targetId) {
    return;
  }
  const userToSave = sanitizeForFirestore({ ...user, id: targetId });
  const path = `users/${targetId}`;
  try {
    await setDoc(doc(db, 'users', targetId), userToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserInFirestore(userId: string, updates: Partial<User>): Promise<void> {
  const targetId = userId || auth.currentUser?.uid;
  if (!targetId) {
    return;
  }
  const path = `users/${targetId}`;
  try {
    const sanitizedUpdates = sanitizeForFirestore(updates);
    await updateDoc(doc(db, 'users', targetId), sanitizedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as User) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getAllUsersFromFirestore(): Promise<User[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const users = snap.docs.map(d => d.data() as User);
    // Exclude demo/test users if flagged, ensuring only genuine users and the institutional admin
    return users.filter(u => !u.isDemo);
  } catch (error) {
    console.warn('Error fetching users from Firestore:', error);
    return [];
  }
}

export function subscribeToUsersFromFirestore(onUpdate: (users: User[]) => void): () => void {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users = snapshot.docs.map(d => d.data() as User).filter(u => !u.isDemo);
      onUpdate(users);
    },
    (error) => {
      console.warn('Subscription error on users:', error);
    }
  );
}

/**
 * MÓDULO 3: Contador Real de Usuarios
 * Consulta server-side segura mediante getCountFromServer para contar cuentas reales únicas.
 */
export async function getRealUsersCountFromFirestore(): Promise<number> {
  const path = 'users';
  try {
    const coll = collection(db, path);
    const snapshot = await getCountFromServer(coll);
    const count = snapshot.data().count;
    return count;
  } catch (error) {
    console.warn('Error fetching real user count from server:', error);
    const users = await getAllUsersFromFirestore();
    return users.length;
  }
}


export async function deleteUserInFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Guarda en Firestore la recompensa e insignia virtual de un reto diario:
 * 1. Actualiza el perfil del usuario (puntos, nivel, lista de insignias y stats).
 * 2. Guarda el badge en la subcolección /users/{userId}/badges/{badge.id}.
 * 3. Registra el logro en la colección global 'achievements'.
 * 4. Guarda el registro de completitud en 'submissions'.
 */
export async function saveDailyChallengeRewardInFirestore(
  userId: string,
  updatedUser: User,
  badge: Badge,
  pointsAwarded: number,
  challengeId: string
): Promise<void> {
  const userPath = `users/${userId}`;
  const achId = `ach_${userId}_${badge.id}_${Date.now()}`;
  const subId = `sub_daily_${userId}_${Date.now()}`;

  try {
    // 1. Actualizar usuario en Firestore
    await updateDoc(doc(db, 'users', userId), {
      points: updatedUser.points,
      level: updatedUser.level,
      levelName: updatedUser.levelName,
      badges: updatedUser.badges,
      stats: updatedUser.stats,
    });

    // 2. Guardar insignia en subcolección de badges del usuario
    await setDoc(doc(db, 'users', userId, 'badges', badge.id), {
      ...badge,
      unlockedAt: new Date().toISOString(),
      awardedForChallenge: challengeId,
    });

    // 3. Registrar logro en la colección 'achievements'
    await setDoc(doc(db, 'achievements', achId), {
      id: achId,
      userId,
      userName: `${updatedUser.name} ${updatedUser.lastName}`.trim(),
      badgeId: badge.id,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      description: badge.description,
      pointsAwarded,
      unlockedAt: new Date().toISOString(),
    });

    // 4. Guardar registro en 'submissions' como aprobado
    await setDoc(doc(db, 'submissions', subId), {
      id: subId,
      challengeId,
      challengeTitle: badge.name,
      challengePoints: pointsAwarded,
      userId,
      userName: `${updatedUser.name} ${updatedUser.lastName}`.trim(),
      userAvatar: updatedUser.avatar,
      userChurch: updatedUser.church,
      date: new Date().toISOString().split('T')[0],
      commentReflection: `¡Reto diario completado con éxito! Desbloqueada la insignia virtual: ${badge.name}`,
      status: 'approved',
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Sistema de Recompensas JA',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

// ============================================================================
// 2. POSTS CRUD
// ============================================================================

/**
 * Obtiene un timestamp numérico para ordenar publicaciones de más reciente a más antigua,
 * admitiendo Firestore Timestamps, números, cadenas ISO y textos relativos legados.
 */
export function getPostTimestamp(post: Partial<Post>): number {
  if (!post || !post.createdAt) return 0;
  const val = post.createdAt as any;

  if (typeof val === 'object' && typeof val.toMillis === 'function') {
    return val.toMillis();
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed) && val.includes('-')) {
      return parsed;
    }
    // Cadenas relativas de datos semilla
    if (val.includes('momento') || val.includes('ahora')) return Date.now();
    if (val.includes('min')) return Date.now() - 1000 * 60 * 5;
    if (val.includes('hora')) return Date.now() - 1000 * 60 * 60 * 2;
    if (val.includes('ayer') || val.includes('Ayer')) return Date.now() - 1000 * 60 * 60 * 24;
    return Date.now() - 1000 * 60 * 60 * 48;
  }
  return 0;
}

export async function createPostInFirestore(post: Post): Promise<void> {
  if (!auth.currentUser) return;
  const path = `posts/${post.id}`;
  try {
    const payload = {
      ...post,
      isOfficial: Boolean(post.isOfficial),
      createdAt: post.createdAt && post.createdAt.includes('-') 
        ? post.createdAt 
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'posts', post.id), sanitizeForFirestore(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePostInFirestore(postId: string, updates: Partial<Post>): Promise<void> {
  if (!auth.currentUser) return;
  const path = `posts/${postId}`;
  try {
    await updateDoc(doc(db, 'posts', postId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePostInFirestore(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getPostsFromFirestore(): Promise<Post[]> {
  const path = 'posts';
  try {
    const q = query(collection(db, path), limit(100));
    const snap = await getDocs(q);
    const posts = snap.docs.map(d => {
      const data = d.data();
      let formattedDate = data.createdAt;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        formattedDate = data.createdAt.toDate().toISOString();
      }
      return {
        ...data,
        id: d.id,
        createdAt: formattedDate || 'Reciente',
      } as Post;
    });

    // Ordenar de más reciente a más antigua
    posts.sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
    return posts;
  } catch (error) {
    console.warn('Error reading posts from Firestore:', error);
    return [];
  }
}

export function subscribeToPostsFromFirestore(onUpdate: (posts: Post[]) => void): () => void {
  const path = 'posts';
  const q = query(collection(db, path), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map(d => {
        const data = d.data();
        let formattedDate = data.createdAt;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          formattedDate = data.createdAt.toDate().toISOString();
        }
        return {
          ...data,
          id: d.id,
          createdAt: formattedDate || 'Reciente',
        } as Post;
      });

      // Ordenar en tiempo real por fecha descendente
      posts.sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

      onUpdate(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ============================================================================
// 3. CHALLENGES & SUBMISSIONS CRUD
// ============================================================================
export async function createChallengeInFirestore(challenge: Challenge): Promise<void> {
  const path = `challenges/${challenge.id}`;
  try {
    await setDoc(doc(db, 'challenges', challenge.id), challenge);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateChallengeInFirestore(challengeId: string, updates: Partial<Challenge>): Promise<void> {
  const path = `challenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'challenges', challengeId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChallengeInFirestore(challengeId: string): Promise<void> {
  const path = `challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'challenges', challengeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getChallengesFromFirestore(): Promise<Challenge[]> {
  const path = 'challenges';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Challenge);
  } catch (error) {
    console.warn('Error reading challenges from Firestore:', error);
    return [];
  }
}

export async function createSubmissionInFirestore(sub: ChallengeSubmission): Promise<void> {
  if (!auth.currentUser) return;
  const path = `submissions/${sub.id}`;
  try {
    await setDoc(doc(db, 'submissions', sub.id), sanitizeForFirestore(sub));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSubmissionStatusInFirestore(
  subId: string, 
  status: SubmissionStatus, 
  adminFeedback?: string,
  reviewedBy?: string
): Promise<void> {
  const path = `submissions/${subId}`;
  try {
    await updateDoc(doc(db, 'submissions', subId), {
      status,
      adminFeedback: adminFeedback || '',
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy || 'Admin'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubmissionInFirestore(subId: string): Promise<void> {
  const path = `submissions/${subId}`;
  try {
    await deleteDoc(doc(db, 'submissions', subId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getSubmissionsFromFirestore(): Promise<ChallengeSubmission[]> {
  const path = 'submissions';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as ChallengeSubmission);
  } catch (error) {
    console.warn('Error reading submissions from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 4. COMMENTS CRUD & SUBCOLLECTION 'comments' DENTRO DE POSTS
// ============================================================================
export async function createCommentInFirestore(comment: Comment, postId: string): Promise<void> {
  if (!auth.currentUser) return;
  const subcollectionPath = `posts/${postId}/comments/${comment.id}`;
  try {
    const cleanComment = sanitizeForFirestore(comment);
    // 1. Guardar en la subcolección 'comments' dentro del documento de la publicación en Firestore
    await setDoc(doc(db, 'posts', postId, 'comments', comment.id), cleanComment);

    // 2. Si es una respuesta anidada a otro comentario, registrar en la subcolección 'replies' del comentario padre
    if (comment.parentId) {
      await setDoc(doc(db, 'posts', postId, 'comments', comment.parentId, 'replies', comment.id), cleanComment);
    }

    // 3. Compatibilidad con colección raíz
    await setDoc(doc(db, 'comments', comment.id), sanitizeForFirestore({ ...comment, postId }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, subcollectionPath);
  }
}

/**
 * Convierte una lista plana de comentarios en un árbol jerárquico de comentarios y respuestas anidadas.
 */
export function buildCommentsTree(flatComments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  flatComments.forEach(c => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  flatComments.forEach(c => {
    const item = commentMap.get(c.id)!;
    if (c.parentId && commentMap.has(c.parentId)) {
      const parent = commentMap.get(c.parentId)!;
      if (!parent.replies) parent.replies = [];
      parent.replies.push(item);
      parent.repliesCount = (parent.repliesCount || 0) + 1;
    } else {
      rootComments.push(item);
    }
  });

  return rootComments;
}

export async function createPostCommentInSubcollection(postId: string, comment: Comment): Promise<void> {
  const path = `posts/${postId}/comments/${comment.id}`;
  try {
    await setDoc(doc(db, 'posts', postId, 'comments', comment.id), comment);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getCommentsForPostFromFirestore(postId: string): Promise<Comment[]> {
  const subPath = `posts/${postId}/comments`;
  try {
    // Intentar leer primero de la subcolección 'comments'
    const snap = await getDocs(collection(db, 'posts', postId, 'comments'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Comment);
    }

    // Fallback a colección raíz
    const q = query(collection(db, 'comments'), where('postId', '==', postId));
    const fallbackSnap = await getDocs(q);
    return fallbackSnap.docs.map(d => d.data() as Comment);
  } catch (error) {
    console.warn(`Error reading comments for post ${postId}:`, error);
    return [];
  }
}

export async function deleteCommentInFirestore(commentId: string): Promise<void> {
  const path = `comments/${commentId}`;
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 5. REACTIONS CRUD
// ============================================================================
export async function saveReactionInFirestore(reaction: ReactionRecord): Promise<void> {
  if (!auth.currentUser) return;
  const path = `reactions/${reaction.id}`;
  try {
    await setDoc(doc(db, 'reactions', reaction.id), sanitizeForFirestore(reaction));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteReactionInFirestore(reactionId: string): Promise<void> {
  const path = `reactions/${reactionId}`;
  try {
    await deleteDoc(doc(db, 'reactions', reactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getReactionsForPostFromFirestore(postId: string): Promise<ReactionRecord[]> {
  const path = 'reactions';
  try {
    const q = query(collection(db, path), where('postId', '==', postId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ReactionRecord);
  } catch (error) {
    console.warn('Error reading reactions from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 6. STORIES CRUD
// ============================================================================
export async function createStoryInFirestore(story: Story): Promise<void> {
  if (!auth.currentUser) return;
  const path = `stories/${story.id}`;
  try {
    await setDoc(doc(db, 'stories', story.id), sanitizeForFirestore(story));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getStoriesFromFirestore(): Promise<Story[]> {
  const path = 'stories';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Story);
  } catch (error) {
    console.warn('Error reading stories from Firestore:', error);
    return [];
  }
}

export async function deleteStoryInFirestore(storyId: string): Promise<void> {
  const path = `stories/${storyId}`;
  try {
    await deleteDoc(doc(db, 'stories', storyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 7. MESSAGES CRUD
// ============================================================================
export async function createMessageInFirestore(message: ChatMessage, conversationId: string): Promise<void> {
  const path = `messages/${message.id}`;
  try {
    await setDoc(doc(db, 'messages', message.id), { ...message, conversationId });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getMessagesForConversationFromFirestore(conversationId: string): Promise<ChatMessage[]> {
  const path = 'messages';
  try {
    const q = query(collection(db, path), where('conversationId', '==', conversationId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ChatMessage);
  } catch (error) {
    console.warn('Error reading messages from Firestore:', error);
    return [];
  }
}

export function subscribeToMessagesFromFirestore(conversationId: string, onUpdate: (messages: ChatMessage[]) => void): () => void {
  const path = 'messages';
  const q = query(collection(db, path), where('conversationId', '==', conversationId));
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      onUpdate(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ============================================================================
// 8. GROUPS CRUD
// ============================================================================
export async function createGroupInFirestore(group: Group): Promise<void> {
  const path = `groups/${group.id}`;
  try {
    await setDoc(doc(db, 'groups', group.id), group);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateGroupInFirestore(groupId: string, updates: Partial<Group>): Promise<void> {
  const path = `groups/${groupId}`;
  try {
    await updateDoc(doc(db, 'groups', groupId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getGroupsFromFirestore(): Promise<Group[]> {
  const path = 'groups';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Group);
  } catch (error) {
    console.warn('Error reading groups from Firestore:', error);
    return [];
  }
}

export async function deleteGroupInFirestore(groupId: string): Promise<void> {
  const path = `groups/${groupId}`;
  try {
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 9. EVENTS CRUD
// ============================================================================
export async function createEventInFirestore(event: EventItem): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), event);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEventInFirestore(eventId: string, updates: Partial<EventItem>): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await updateDoc(doc(db, 'events', eventId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEventInFirestore(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getEventsFromFirestore(): Promise<EventItem[]> {
  const path = 'events';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as EventItem);
  } catch (error) {
    console.warn('Error reading events from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 10. BADGES CRUD
// ============================================================================
export async function createBadgeInFirestore(badge: Badge): Promise<void> {
  const path = `badges/${badge.id}`;
  try {
    await setDoc(doc(db, 'badges', badge.id), badge);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getBadgesFromFirestore(): Promise<Badge[]> {
  const path = 'badges';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Badge);
  } catch (error) {
    console.warn('Error reading badges from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 11. ACHIEVEMENTS CRUD
// ============================================================================
export async function createAchievementInFirestore(achievement: Achievement): Promise<void> {
  const path = `achievements/${achievement.id}`;
  try {
    await setDoc(doc(db, 'achievements', achievement.id), achievement);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserAchievementsFromFirestore(userId: string): Promise<Achievement[]> {
  const path = 'achievements';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Achievement);
  } catch (error) {
    console.warn('Error reading achievements from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 12. NOTIFICATIONS CRUD
// ============================================================================
export async function createNotificationInFirestore(notification: NotificationItem, userId: string): Promise<void> {
  const path = `notifications/${notification.id}`;
  try {
    await setDoc(doc(db, 'notifications', notification.id), { ...notification, userId });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserNotificationsFromFirestore(userId: string): Promise<NotificationItem[]> {
  const path = 'notifications';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as NotificationItem);
  } catch (error) {
    console.warn('Error reading notifications from Firestore:', error);
    return [];
  }
}

export async function markNotificationReadInFirestore(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNotificationInFirestore(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 13. REPORTS CRUD
// ============================================================================
export async function createReportInFirestore(report: Report): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getReportsFromFirestore(): Promise<Report[]> {
  const path = 'reports';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Report);
  } catch (error) {
    console.warn('Error reading reports from Firestore:', error);
    return [];
  }
}

export async function updateReportStatusInFirestore(
  reportId: string, 
  status: 'resolved' | 'dismissed',
  resolutionNotes?: string,
  reviewedBy?: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      resolutionNotes: resolutionNotes || '',
      reviewedBy: reviewedBy || 'Admin'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// 14. OFFICIAL SOURCES CRUD
// ============================================================================
export async function createOfficialSourceInFirestore(source: OfficialSource): Promise<void> {
  const path = `official_sources/${source.id}`;
  try {
    await setDoc(doc(db, 'official_sources', source.id), source);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getOfficialSourcesFromFirestore(): Promise<OfficialSource[]> {
  const path = 'official_sources';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as OfficialSource);
  } catch (error) {
    console.warn('Error reading official sources from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 15. NEWS CRUD
// ============================================================================
export async function createNewsInFirestore(news: NewsItem): Promise<void> {
  const path = `news/${news.id}`;
  try {
    await setDoc(doc(db, 'news', news.id), news);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getNewsFromFirestore(): Promise<NewsItem[]> {
  const path = 'news';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as NewsItem);
  } catch (error) {
    console.warn('Error reading news from Firestore:', error);
    return [];
  }
}

export async function deleteNewsInFirestore(newsId: string): Promise<void> {
  const path = `news/${newsId}`;
  try {
    await deleteDoc(doc(db, 'news', newsId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 16. CHANNELS CRUD
// ============================================================================
export async function createChannelInFirestore(channel: ChannelItem): Promise<void> {
  const path = `channels/${channel.id}`;
  try {
    await setDoc(doc(db, 'channels', channel.id), channel);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getChannelsFromFirestore(): Promise<ChannelItem[]> {
  const path = 'channels';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as ChannelItem);
  } catch (error) {
    console.warn('Error reading channels from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 17. GAMES CRUD
// ============================================================================
export async function createGameInFirestore(game: Game): Promise<void> {
  const path = `games/${game.id}`;
  try {
    await setDoc(doc(db, 'games', game.id), game);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getGamesFromFirestore(): Promise<Game[]> {
  const path = 'games';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Game);
  } catch (error) {
    console.warn('Error reading games from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 18. GAME SCORES CRUD
// ============================================================================
export async function createGameScoreInFirestore(score: GameScore): Promise<void> {
  const path = `game_scores/${score.id}`;
  try {
    await setDoc(doc(db, 'game_scores', score.id), score);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getGameScoresFromFirestore(): Promise<GameScore[]> {
  const path = 'game_scores';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as GameScore);
  } catch (error) {
    console.warn('Error reading game scores from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 19. PRAYER REQUESTS CRUD
// ============================================================================
export async function createPrayerInFirestore(prayer: PrayerRequest): Promise<void> {
  if (!auth.currentUser) return;
  const path = `prayers/${prayer.id}`;
  try {
    await setDoc(doc(db, 'prayers', prayer.id), sanitizeForFirestore(prayer));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePrayerInFirestore(prayerId: string, updates: Partial<PrayerRequest>): Promise<void> {
  if (!auth.currentUser) return;
  const path = `prayers/${prayerId}`;
  try {
    await updateDoc(doc(db, 'prayers', prayerId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePrayerInFirestore(prayerId: string): Promise<void> {
  const path = `prayers/${prayerId}`;
  try {
    await deleteDoc(doc(db, 'prayers', prayerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getPrayersFromFirestore(): Promise<PrayerRequest[]> {
  const path = 'prayers';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as PrayerRequest);
  } catch (error) {
    console.warn('Error reading prayers from Firestore:', error);
    return [];
  }
}

// ============================================================================
// 20. TESTIMONIALS CRUD
// ============================================================================
export async function createTestimonialInFirestore(test: Testimonial): Promise<void> {
  if (!auth.currentUser) return;
  const path = `testimonials/${test.id}`;
  try {
    await setDoc(doc(db, 'testimonials', test.id), sanitizeForFirestore(test));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTestimonialInFirestore(testId: string, updates: Partial<Testimonial>): Promise<void> {
  if (!auth.currentUser) return;
  const path = `testimonials/${testId}`;
  try {
    await updateDoc(doc(db, 'testimonials', testId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTestimonialInFirestore(testId: string): Promise<void> {
  const path = `testimonials/${testId}`;
  try {
    await deleteDoc(doc(db, 'testimonials', testId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getTestimonialsFromFirestore(): Promise<Testimonial[]> {
  const path = 'testimonials';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Testimonial);
  } catch (error) {
    console.warn('Error reading testimonials from Firestore:', error);
    return [];
  }
}

// ============================================================================
// CHURCHES CRUD
// ============================================================================
export async function createChurchInFirestore(church: Church): Promise<void> {
  const path = `churches/${church.id}`;
  try {
    await setDoc(doc(db, 'churches', church.id), church);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getChurchesFromFirestore(): Promise<Church[]> {
  const path = 'churches';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as Church);
  } catch (error) {
    console.warn('Error reading churches from Firestore:', error);
    return [];
  }
}

// ============================================================================
// POINT TRANSACTIONS (Auditable Points Ledger)
// ============================================================================
export async function createPointTransactionInFirestore(tx: PointTransaction): Promise<void> {
  const path = `point_transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'point_transactions', tx.id), sanitizeForFirestore(tx));
  } catch (error) {
    console.warn('Error saving point transaction:', error);
  }
}

export async function getPointTransactionsForUser(userId: string): Promise<PointTransaction[]> {
  const path = 'point_transactions';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), limit(100));
    const snap = await getDocs(q);
    const txs = snap.docs.map(d => d.data() as PointTransaction);
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Error reading point transactions for user:', error);
    return [];
  }
}

export async function getAllPointTransactionsFromFirestore(): Promise<PointTransaction[]> {
  const path = 'point_transactions';
  try {
    const q = query(collection(db, path), limit(200));
    const snap = await getDocs(q);
    const txs = snap.docs.map(d => d.data() as PointTransaction);
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Error reading all point transactions:', error);
    return [];
  }
}

// ============================================================================
// FRIEND INVITATIONS
// ============================================================================
export async function createInvitationInFirestore(invite: FriendInvitation): Promise<void> {
  const path = `invitations/${invite.id}`;
  try {
    await setDoc(doc(db, 'invitations', invite.id), sanitizeForFirestore(invite));
  } catch (error) {
    console.warn('Error saving invitation in Firestore:', error);
  }
}

export async function getInvitationsForUser(userId: string): Promise<FriendInvitation[]> {
  const path = 'invitations';
  try {
    const q = query(collection(db, path), where('inviterUserId', '==', userId), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FriendInvitation);
  } catch (error) {
    console.warn('Error reading user invitations from Firestore:', error);
    return [];
  }
}

// ============================================================================
// LIVE STREAMS & LIVE CHAT (Firestore Synchronized)
// ============================================================================
export async function createLiveStreamInFirestore(stream: LiveStreamSession): Promise<void> {
  const path = `live_streams/${stream.id}`;
  try {
    await setDoc(doc(db, 'live_streams', stream.id), sanitizeForFirestore(stream));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLiveStreamInFirestore(streamId: string, updates: Partial<LiveStreamSession>): Promise<void> {
  const path = `live_streams/${streamId}`;
  try {
    await updateDoc(doc(db, 'live_streams', streamId), sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLiveStreamInFirestore(streamId: string): Promise<void> {
  const path = `live_streams/${streamId}`;
  try {
    await deleteDoc(doc(db, 'live_streams', streamId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToLiveStreamsFromFirestore(onUpdate: (streams: LiveStreamSession[]) => void): () => void {
  const path = 'live_streams';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const streams = snapshot.docs.map(d => d.data() as LiveStreamSession);
      onUpdate(streams);
    },
    (error) => {
      console.warn('Live streams subscription error:', error);
    }
  );
}

export async function addLiveChatMessageInFirestore(
  streamId: string, 
  message: { id: string; userName: string; message: string; timestamp: string }
): Promise<void> {
  const path = `live_streams/${streamId}`;
  try {
    const streamRef = doc(db, 'live_streams', streamId);
    const snap = await getDoc(streamRef);
    if (snap.exists()) {
      const current = snap.data() as LiveStreamSession;
      const nextMessages = [...(current.chatMessages || []), message].slice(-50); // Keep last 50
      await updateDoc(streamRef, { chatMessages: nextMessages });
    }
  } catch (error) {
    console.warn('Error adding live chat message:', error);
  }
}

export function subscribeToSingleLiveStream(
  streamId: string, 
  onUpdate: (stream: LiveStreamSession | null) => void
): () => void {
  return onSnapshot(
    doc(db, 'live_streams', streamId),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as LiveStreamSession);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Single live stream subscription error:', error);
    }
  );
}

export async function updateSignalingForViewer(
  streamId: string,
  viewerId: string,
  viewerData: any
): Promise<void> {
  const streamRef = doc(db, 'live_streams', streamId);
  try {
    await updateDoc(streamRef, {
      [`signaling.${viewerId}`]: sanitizeForFirestore(viewerData)
    });
  } catch (error) {
    console.warn('Error updating viewer signaling:', error);
  }
}


