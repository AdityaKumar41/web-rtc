"use client";
import { usePathname, useSearchParams } from "next/navigation";

export default function Page() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").pop();

  return (
    <div className="bg-black h-screen w-screen text-white">Room {slug}</div>
  );
}
