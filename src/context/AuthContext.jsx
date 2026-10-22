import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { getUserRole, saveUserRole } from "../services/db";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Turns a Firebase auth error into something a customer can act on.
// Returns "" when the person simply closed the Google window (nothing to show).
export const authErrorMessage = (err) => {
  switch (err?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/network-request-failed":
      return "No internet connection. Check your network and try again.";
    default:
      return "Could not sign in with Google. Please try again.";
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // While signInAs is running it sets user + role itself, so the listener must not
  // overwrite them with a half-finished read (this used to cause a role = null flash).
  const signingIn = useRef(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (signingIn.current) return;
      setUser(u);
      setRole(u ? await getUserRole(u.uid).catch(() => null) : null);
      setLoading(false);
    });
  }, []);

  // Google sign-in. A role is only saved when the person chooses a role-specific action.
  const authenticate = async (nextRole) => {
    signingIn.current = true;
    let current = null;
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      current = result.user;
      let resolvedRole;
      if (nextRole) {
        await saveUserRole(current.uid, nextRole);
        resolvedRole = nextRole;
      } else {
        resolvedRole = await getUserRole(current.uid);
      }
      setUser(current);
      setRole(resolvedRole);
      setLoading(false);
      return current;
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Signed in but the role could not be saved: sign out so the app is never half logged in.
      if (current) {
        await signOut(auth).catch(() => {});
        setUser(null);
        setRole(null);
      }
      throw error;
    } finally {
      signingIn.current = false;
    }
  };

  const signIn = () => authenticate();
  const signInAs = (nextRole) => authenticate(nextRole);

  // Change the role of the person who is already signed in (no Google pop-up needed).
  const switchRole = async (nextRole) => {
    if (!user) return;
    await saveUserRole(user.uid, nextRole);
    setRole(nextRole);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signInAs, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
