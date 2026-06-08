import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { auth, db } from './config/firebase';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import PwaInstallPrompt from './components/PwaInstallPrompt';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.email);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              name: data.name,
              role: data.role,
              unit: data.unit
            });
          } else {
            // Default fallbacks if user entry doesn't exist in Firestore database yet
            if (currentUser.email.includes('admin')) {
              await setDoc(userDocRef, {
                email: currentUser.email,
                name: 'Super Admin',
                role: 'Super Admin',
                unit: 'Pusat',
                createdAt: new Date().toISOString()
              });
              setUser({
                uid: currentUser.uid,
                email: currentUser.email,
                name: 'Super Admin',
                role: 'Super Admin',
                unit: 'Pusat'
              });
            } else {
              await setDoc(userDocRef, {
                email: currentUser.email,
                name: 'Akun Tutor Bersama',
                role: 'Tutor',
                unit: 'PKBM Al Barakah',
                createdAt: new Date().toISOString()
              });
              setUser({
                uid: currentUser.uid,
                email: currentUser.email,
                name: 'Akun Tutor Bersama',
                role: 'Tutor',
                unit: 'PKBM Al Barakah'
              });
            }
          }
        } catch (error) {
          console.error("Kesalahan otentikasi:", error);
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-emerald-50 text-emerald-800 font-bold font-sans">
        Memverifikasi Keamanan Sistem...
      </div>
    );
  }

  return (
    <>
      {!user ? <LoginPage /> : <Dashboard user={user} />}
      <PwaInstallPrompt />
    </>
  );
}