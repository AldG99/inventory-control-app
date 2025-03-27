import React, { createContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async userAuth => {
      if (userAuth) {
        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userAuth.uid));
        if (userDoc.exists()) {
          setUser({
            uid: userAuth.uid,
            email: userAuth.email,
            ...userDoc.data(),
          });
        } else {
          setUser({
            uid: userAuth.uid,
            email: userAuth.email,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Registrar usuario
  const register = async (email, password, userData) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Guardar información adicional del usuario en Firestore
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
        email,
        createdAt: new Date(),
        ...userData,
      });
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // Cerrar sesión
  const logout = () => {
    return signOut(auth);
  };

  // Recuperar contraseña
  const resetPassword = email => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
