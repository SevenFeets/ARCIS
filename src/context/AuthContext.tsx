import { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateEmail,
    updatePassword,
    deleteUser,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    updateUserEmail: (newEmail: string) => Promise<void>;
    updateUserPassword: (newPassword: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    return useContext(AuthContext) as AuthContextType;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    function signup(email: string, password: string) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(() => { });
    }

    function login(email: string, password: string) {
        return signInWithEmailAndPassword(auth, email, password)
            .then(() => { });
    }

    function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider)
            .then(() => { });
    }

    function logout() {
        return signOut(auth).then(() => {
            setCurrentUser(null);
        });
    }

    function updateUserEmail(newEmail: string) {
        if (!currentUser) throw new Error("No user logged in");
        return updateEmail(currentUser, newEmail);
    }

    function updateUserPassword(newPassword: string) {
        if (!currentUser) throw new Error("No user logged in");
        return updatePassword(currentUser, newPassword);
    }

    function deleteAccount() {
        if (!currentUser) throw new Error("No user logged in");
        return deleteUser(currentUser);
    }

    function resetPassword(email: string) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        login,
        signup,
        logout,
        loginWithGoogle,
        updateUserEmail,
        updateUserPassword,
        deleteAccount,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 