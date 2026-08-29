import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isConfigured } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Immediately set user state to unblock the Loading screen
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL,
        });
        setLoading(false);

        // 2. Do Firestore profile creation in the background
        (async () => {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL || null,
                createdAt: new Date().toISOString(),
                stats: {
                  totalGames: 0,
                  wins: 0,
                  losses: 0,
                  draws: 0,
                  totalScore: 0,
                  highestGameScore: 0,
                  bestWord: '',
                  bestWordScore: 0,
                  currentStreak: 0,
                  longestStreak: 0,
                  wordsPlayed: 0,
                },
              });
            }
          } catch (error) {
            console.error("Error creating user profile in Firestore:", error);
          }
        })();

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign up with email/password
  const signup = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name
    await updateProfile(credential.user, { displayName });
    return credential.user;
  };

  // Login with email/password
  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    isConfigured,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
