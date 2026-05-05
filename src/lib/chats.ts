import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageData {
  role: 'user' | 'model';
  text: string;
  createdAt: Timestamp;
}

export const createChat = async (userId: string, firstMessage: string) => {
  const path = 'chats';
  try {
    const chatRef = await addDoc(collection(db, path), {
      userId,
      title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return chatRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const saveMessage = async (chatId: string, role: 'user' | 'model', text: string) => {
  const path = `chats/${chatId}/messages`;
  try {
    await addDoc(collection(db, path), {
      role,
      text,
      createdAt: serverTimestamp(),
    });
    // Update chat timestamp
    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteChat = async (chatId: string) => {
  const path = `chats/${chatId}`;
  try {
    await deleteDoc(doc(db, 'chats', chatId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getChats = async (userId: string) => {
  const path = 'chats';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getMessages = async (chatId: string) => {
  const path = `chats/${chatId}/messages`;
  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as MessageData);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
