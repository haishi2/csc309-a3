import AuthForm from "@/components/AuthForm/AuthForm";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AuthPage() {
  const location = useLocation();
  const message = location.state?.message;

  useEffect(() => {
    if (message) {
      toast.success(message);
    }
  }, [message]);

  return <AuthForm />;
}
