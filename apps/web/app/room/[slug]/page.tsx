"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect } from "react";
import { Context } from "../../../store/context";
import { usePeer } from "../../../store/Peer";

export default function Page() {
  const { socket } = useContext(Context);
  const { peer, createOffer } = usePeer();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").pop();

  const handleNewUserJoined = useCallback(
    async ({ email }: { email: string }) => {
      console.log("New user joined:", email); // Added logging for debugging
      const offer = await createOffer();
      socket.emit("call-user", { email, offer });
    },
    [createOffer, socket]
  );

  const handleIncommingCall = useCallback(
    async ({ from, offer }: { from: string; offer: string }) => {
      console.log("Incoming call from:", from); // Added logging for debugging
      if (!peer) {
        console.error("RTCPeerConnection is not initialized");
        return;
      }
      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(offer))
        );
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer-call", { to: from, answer });
      } catch (error) {
        console.error("Failed to handle incoming call:", error);
      }
    },
    [socket, peer]
  );

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncommingCall);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncommingCall);
    };
  }, [socket, handleNewUserJoined, handleIncommingCall]);

  return (
    <div className="bg-black h-screen w-screen text-white">Room {slug}</div>
  );
}
