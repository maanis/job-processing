import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authenticate } from "@/services/api";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const [status, setStatus] = useState<"loading" | "ok" | "redirect">(
    token ? "loading" : "redirect",
  );
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // const token = localStorage.getItem('token');

    if (!token) {
      setStatus("redirect");
      return;
    }

    let mounted = true;

    const verify = async () => {
      try {
        const res = await authenticate();

        if (!mounted) return;

        if (res?.authenticated) {
          if (res.client) {
            localStorage.setItem("user", JSON.stringify(res.client));
            localStorage.setItem("role", res.client.role || "");
          }

          const role = res.client?.role || localStorage.getItem("role");
          const path = location.pathname;

          // Redirect to appropriate dashboard if on wrong page
          if (
            role === "admin" &&
            (path === "/dashboard" || path === "/failed-rows")
          ) {
            setRedirectTo("/admin/dashboard");
            return;
          } else if (role !== "admin" && path.startsWith("/admin")) {
            setRedirectTo("/dashboard");
            return;
          }

          setStatus("ok");
        } else {
          throw new Error("Not authenticated");
        }
      } catch {
        localStorage.clear();
        setStatus("redirect");
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Checking authentication…
          </div>
        </div>
      </div>
    );
  }
  if (status === "redirect") return <Navigate to="/login" replace />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return children;
}
