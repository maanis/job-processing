import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

    </header>
  );
}
