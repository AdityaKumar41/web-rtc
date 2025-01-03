"use client";
import { usePathname } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../../../store/context";
import { usePeer } from "../../../store/Peer";

export default function Page() {
  const { socket } = useContext(Context);
  const { peer, createOffer } = usePeer();
  const pathname = usePathname();
  const slug = pathname.split("/").pop();
  const [remoteEmail, setRemoteEmail] = useState<string | null>(null);
  const [iceCandidates, setIceCandidates] = useState<RTCIceCandidate[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        peer?.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  useEffect(() => {
    // Join room when component mounts
    if (socket && slug) {
      const email = new URLSearchParams(window.location.search).get("email");
      if (email) {
        socket.emit("joined-room", { roomCode: slug, email });
      }
    }
  }, [socket, slug]);

  const handleNewUserJoined = useCallback(
    async ({ email }: { email: string }) => {
      console.log("New user joined:", email);
      setRemoteEmail(email);
      const offer = await createOffer();
      if (offer) {
        socket.emit("call-user", { email, offer: JSON.stringify(offer) });
      }
    },
    [createOffer, socket]
  );

  const handleIncommingCall = useCallback(
    async ({ from, offer }: { from: string; offer: string }) => {
      console.log("Incoming call from:", from);
      setRemoteEmail(from);
      if (!peer) return;

      try {
        const offerDesc = JSON.parse(offer);
        await peer.setRemoteDescription(new RTCSessionDescription(offerDesc));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("answer-call", {
          to: from,
          answer: JSON.stringify(answer),
        });
      } catch (error) {
        console.error("Failed to handle incoming call:", error);
      }
    },
    [socket, peer]
  );

  const handleCallAnswered = useCallback(
    async ({ answer }: { answer: string }) => {
      console.log("Call answered:", answer);
      if (!peer) return;
      try {
        const answerDesc = JSON.parse(answer);
        await peer.setRemoteDescription(new RTCSessionDescription(answerDesc));
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    },
    [peer]
  );

  const processIceCandidates = async () => {
    if (peer && iceCandidates.length > 0) {
      try {
        for (const candidate of iceCandidates) {
          await peer.addIceCandidate(candidate);
        }
        setIceCandidates([]); // Clear processed candidates
      } catch (error) {
        console.error("Error processing ICE candidates:", error);
      }
    }
  };

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncommingCall);
    socket.on("call-answered", handleCallAnswered);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncommingCall);
      socket.off("call-answered", handleCallAnswered);
    };
  }, [socket, handleNewUserJoined, handleIncommingCall, handleCallAnswered]);

  useEffect(() => {
    if (!peer) return;

    const handleICECandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && remoteEmail) {
        socket.emit("ice-candidate", {
          to: remoteEmail,
          candidate: event.candidate,
        });
      }
    };

    const handleConnectionStateChange = () => {
      console.log("Connection state:", peer.connectionState);
    };

    peer.addEventListener("icecandidate", handleICECandidate);
    peer.addEventListener("connectionstatechange", handleConnectionStateChange);

    socket.on(
      "ice-candidate",
      ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (peer.remoteDescription) {
          peer.addIceCandidate(iceCandidate).catch(console.error);
        } else {
          setIceCandidates((prev) => [...prev, iceCandidate]);
        }
      }
    );

    return () => {
      peer.removeEventListener("icecandidate", handleICECandidate);
      peer.removeEventListener(
        "connectionstatechange",
        handleConnectionStateChange
      );
      socket.off("ice-candidate");
    };
  }, [peer, socket, remoteEmail]);

  // Process stored ICE candidates after remote description is set
  useEffect(() => {
    if (peer?.remoteDescription) {
      processIceCandidates();
    }
  }, [peer?.remoteDescription]);

  useEffect(() => {
    setupMediaStream();
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!peer) return;

    peer.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  }, [peer]);

  return (
    <div className="bg-black h-screen w-screen text-white p-4">
      <div className="relative h-full">
        {/* Remote Video (Large) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-lg"
        />

        {/* Local Video (Small Overlay) */}
        <div className="absolute bottom-4 right-4 w-48 h-36">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-900/80 p-4 rounded-lg">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${
              isMuted ? "bg-red-500" : "bg-gray-600"
            }`}
          >
            {isMuted ? "🔇" : "🎤"}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOff ? "bg-red-500" : "bg-gray-600"
            }`}
          >
            {isVideoOff ? "📵" : "📹"}
          </button>
        </div>
      </div>
    </div>
  );
}
