import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // קריאה לשרת לבדוק אם יש session פעיל
    const checkSession = async () => {
      try {
        const res = await fetch("/users/check-session", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data); 
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          setUser(null); // אין session
          localStorage.removeItem("user");
        }
      } catch (err) {
        console.error("Session check failed", err);
        setUser(null);
        localStorage.removeItem("user");
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
