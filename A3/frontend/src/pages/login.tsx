import { InputForm } from "@/components/auth/login";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6 rounded-lg shadow-md">
        <InputForm />
      </div>
    </div>
  );
}
