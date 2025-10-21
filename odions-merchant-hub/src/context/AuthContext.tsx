// import React, { createContext, useContext, useEffect, useState } from 'react';
// import type { Session, User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';
// import authService from '../services/api';

// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string, fullName: string) => Promise<void>;
//   signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });
//     return () => subscription.unsubscribe();
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     const data = await authService.signIn({ email, password });
//     setSession(data.session);
//     setUser(data.user);
//   };

//   const signUp = async (email: string, password: string, fullName: string) => {
//     const data = await authService.signUp({ email, password, fullName });
//     setSession(data.session);
//     setUser(data.user);
//   };

//   const signOut = async () => {
//     await authService.signOut();
//     setSession(null);
//     setUser(null);
//   };

//   const value = { user, session, loading, signIn, signUp, signOut };
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import authService from "../services/api";

interface AuthContextType {
user: User | null;
session: Session | null;
loading: boolean;
signIn: (email: string, password: string) => Promise<void>;
signUp: (email: string, password: string, fullName: string) => Promise<void>;
signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<User | null>(null);
const [session, setSession] = useState<Session | null>(null);
const [loading, setLoading] = useState(true);

// 🔹 Load session from Supabase localStorage (persists after reload)
useEffect(() => {
const loadSession = async () => {
const {
data: { session },
} = await supabase.auth.getSession();
  if (session) {
    setSession(session);
    setUser(session.user);
  } else {
    setSession(null);
    setUser(null);
  }
  setLoading(false);
};

loadSession();

// 🔹 Listen to Supabase auth changes (sign in/out, refresh)
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session) {
    localStorage.setItem("supabaseSession", JSON.stringify(session));
  } else {
    localStorage.removeItem("supabaseSession");
  }
  setLoading(false);
});

return () => subscription.unsubscribe();
}, []);

// 🔹 Manual login (custom backend)
const signIn = async (email: string, password: string) => {
const data = await authService.signIn({ email, password });

// Save session manually if not handled by Supabase
if (data.session) {
  setSession(data.session);
  setUser(data.user);
  localStorage.setItem("supabaseSession", JSON.stringify(data.session));
}
};

// 🔹 Manual signup (custom backend)
const signUp = async (email: string, password: string, fullName: string) => {
const data = await authService.signUp({ email, password, fullName });
if (data.session) {
setSession(data.session);
setUser(data.user);
localStorage.setItem("supabaseSession", JSON.stringify(data.session));
}
};

// 🔹 Manual logout (custom backend)
const signOut = async () => {
await authService.signOut();
await supabase.auth.signOut(); // also clear Supabase session
localStorage.removeItem("supabaseSession");
setSession(null);
setUser(null);
};

const value = { user, session, loading, signIn, signUp, signOut };

return (
<AuthContext.Provider value={value}>
{!loading && children}
</AuthContext.Provider>
);
}

export function useAuth() {
const context = useContext(AuthContext);
if (context === undefined) {
throw new Error("useAuth must be used within an AuthProvider");
}
return context;
}
