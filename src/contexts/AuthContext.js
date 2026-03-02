import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage ONLY on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const stored = localStorage.getItem('userData');
        console.log("[AuthProvider] Initializing from localStorage.. .");
        
        if (stored) {
          const parsedData = JSON.parse(stored);
          console.log("[AuthProvider] Found stored userData for:", parsedData.email);
          
          // ✅ FETCH FRESH DATA FROM FIRESTORE instead of using cached data
          const userQuery = query(
            collection(db, 'users'),
            where('email', '==', parsedData.email)
          );
          const userSnap = await getDocs(userQuery);
          
          if (! userSnap.empty) {
            const freshUserData = {
              ... userSnap.docs[0].data(),
              uid: userSnap.docs[0].id
            };
            console.log("[AuthProvider] Loaded fresh data from Firestore:", freshUserData. email);
            setUserData(freshUserData);
          } else {
            // User doesn't exist in Firestore, clear localStorage
            console.log("[AuthProvider] User not found in Firestore, clearing cache");
            localStorage.removeItem('userData');
            setUserData(null);
          }
        } else {
          console.log("[AuthProvider] No userData in localStorage");
          setUserData(null);
        }
      } catch (error) {
        console.error('[AuthProvider] Error initializing:', error);
        localStorage.removeItem('userData');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ FIX: Update userData - clear old data immediately
  const updateUserData = (data) => {
    console.log("[AuthProvider] Updating userData for:", data?. email);
    setUserData(data);
    if (data) {
      localStorage.setItem('userData', JSON.stringify(data));
    } else {
      localStorage.removeItem('userData');
    }
  };

  // ✅ FIX:  Proper logout - clear everything
  const logout = () => {
    console.log("[AuthProvider] Logging out user");
    localStorage.clear(); // ✅ Clear ALL localStorage
    sessionStorage.clear(); // ✅ Clear session storage too
    setUserData(null);
    setCurrentUser(null);
    return { success: true };
  };

  // Refresh user data from Firestore (call this after important changes)
  const refreshUserData = async () => {
    if (!userData?. email) return;
    
    try {
      console.log("[AuthProvider] Refreshing user data from Firestore.. .");
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', userData.email)
      );
      const userSnap = await getDocs(userQuery);
      
      if (!userSnap.empty) {
        const freshData = {
          ...userSnap.docs[0].data(),
          uid: userSnap.docs[0].id
        };
        console.log("[AuthProvider] Refreshed data from Firestore");
        setUserData(freshData);
        localStorage.setItem('userData', JSON. stringify(freshData));
      }
    } catch (error) {
      console.error('[AuthProvider] Error refreshing data:', error);
    }
  };

  // Create user function (for Dean/Counsellor creating other users)
  const createUser = async (email, password, userDataObj) => {
    try {
      // Check if user already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Generate a unique ID for the user
      const newUserRef = doc(collection(db, 'users'));
      await setDoc(newUserRef, {
        ... userDataObj,
        uid:  newUserRef.id,
        email:  email,
        password: password,
        createdAt: new Date().toISOString(),
        points: 0,
        isActive: true
      });
      
      return { success: true, uid: newUserRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error:  error.message };
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    logout,
    createUser,
    setUserData:  updateUserData,
    refreshUserData, // ✅ NEW:  Function to refresh data
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;