"use client";
import React, { useMemo, ReactNode } from "react";

interface PeerContextType {
  peer: RTCPeerConnection | null;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
}

const PeerContext = React.createContext<PeerContextType>({
  peer: null,
  createOffer: async () => null,
});

export const usePeer = () => React.useContext(PeerContext);

interface PeerProviderProps {
  children: ReactNode;
}

export const PeerProvider = ({ children }: PeerProviderProps) => {
  const peer = useMemo(() => {
    try {
      return new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:5349",
          },
        ],
      });
    } catch (error) {
      console.error("Failed to create RTCPeerConnection:", error);
      return null;
    }
  }, []);

  const createOffer = async () => {
    if (!peer) {
      console.error("RTCPeerConnection is not initialized");
      return null;
    }
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("Failed to create offer:", error);
      return null;
    }
  };

  return (
    <PeerContext.Provider value={{ peer, createOffer }}>
      {children}
    </PeerContext.Provider>
  );
};
