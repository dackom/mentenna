"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Link from "next/link";

export default function Home() {
  const { refetch, data: session } = authClient.useSession();
  const router = useRouter();
  const signOut = async () => {
    Swal.fire({
      title: "Are you sure you want to sign out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await authClient.signOut();
        refetch();
        router.push("/");
      }
    });
  };

  return (
    <div>
      <h1>Home</h1>
      {session?.user?.role === "admin" && (
        <Link href="/admin">
          <Button>Go to Admin</Button>
        </Link>
      )}
      {session?.session ? (
        <Button onClick={signOut}>Sign Out</Button>
      ) : (
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      )}
    </div>
  );
}
