"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DrinksRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/menu/drinks"); });
  return null;
}
