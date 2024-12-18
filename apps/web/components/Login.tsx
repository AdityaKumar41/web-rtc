"use client";
import { FormEvent, useContext, useEffect, useState } from "react";
import { Context } from "../store/context";
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useRouter();

  const { socket } = useContext(Context);

  const handleRoomCode = ({ roomCode }: { roomCode: string }) => {
    navigate.push(`/room/${roomCode}`);
  };

  useEffect(() => {
    socket.on("join-room", handleRoomCode);
  }, [socket]);

  const handleOnSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !roomCode) return;
    if (email === "" || roomCode === "") return;
    socket.emit("joined-room", { email, roomCode });
  };

  return (
    <div className="bg-black h-screen w-screen flex justify-center items-center">
      <form onSubmit={handleOnSubmit} className="flex flex-col gap-2">
        <div className="text-white ">
          <input
            type="text"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#212121] w-80 min-w-64 focus:outline-none   p-3 rounded-lg"
          />
        </div>
        <div className="text-white">
          <input
            type="number"
            placeholder="Enter RoomCode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="bg-[#212121] w-80 min-w-64 focus:outline-none  p-3 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Login;
