import { useCallback } from 'react';
import { auth } from '../api/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const { user, loading } = useAuthContext();

  const signInWithEmail = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return { user, loading, signInWithEmail, signUpWithEmail, signOut, logout };
}

