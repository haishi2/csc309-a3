import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useNavigate } from "react-router-dom";
import { config } from "@/config/environment";

const FormSchema = z.object({
  utorid: z.string().length(8, { message: "Invalid utorid" }),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 8 characters.",
    })
    .max(20, { message: "Password must be less than 20 characters." }),
});

export function InputForm() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      utorid: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const response = await fetch(`${config.server.apiUrl}/auth/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      login(result.token);

      toast.success("Login successful!", {
        description: "You are now logged in.",
      });

      // redirect to home page
      navigate("/");
    } catch (error) {
      toast.error("Login failed", {
        description: "Please check your credentials and try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6"
      >
        <FormField
          control={form.control}
          name="utorid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UTORid</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
}
