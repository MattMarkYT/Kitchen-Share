"use client";

import React, { createContext, useContext, useState } from "react";

type LoginContextType = {
    isOnLogin: boolean;
    setIsOnLogin: (value: boolean) => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export const LoginProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOnLogin, setIsOnLogin] = useState(false);

    return (
        <LoginContext.Provider value={{ isOnLogin, setIsOnLogin }}>
            {children}
        </LoginContext.Provider>
    );
};

export const useIsLogin = () => {
    const context = useContext(LoginContext);
    if (!context) {
        throw new Error("useIsLogin must be used within a LoginProvider");
    }
    return context;
};