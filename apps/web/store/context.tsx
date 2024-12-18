"use client";
import React, { createContext, useState, useMemo } from "react";
import { io } from "socket.io-client";

interface userTypes {
  email: string;
  roomcode: string;
}

export const Context = createContext({
  user: null as userTypes | null,
  socket: null as any,
});

interface IContext {
  children: React.ReactNode;
}

export const Provider = ({ children }: IContext) => {
  const [user, setUser] = useState<userTypes | null>(null);
  // function createUser(email: string, roomcode: string) {
  //   setUser({ email, roomcode });
  // }

  const socket = useMemo(() => {
    return io("http://localhost:8001");
  }, []);

  return (
    <Context.Provider value={{ socket, user }}>{children}</Context.Provider>
  );
};
