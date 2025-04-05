import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import AppTheme from "@/theme/shared-theme/AppTheme";
import { useAuthStore } from "@/stores/auth-store";
import { login as loginApi } from "@/services/api/auth-api";
import { useQueryClient } from "@tanstack/react-query";
import { USER_QUERY_KEY } from "@/hooks/useUser";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

const FadeTransition = styled("div")({
  transition: "opacity 0.4s ease-in-out",
  opacity: 1,
  "&.fade-out": {
    opacity: 0,
  },
});

export default function AuthForm(props: {
  disableCustomTheme?: boolean;
  initialMode?: "signin" | "signup";
}) {
  const { initialMode = "signup" } = props;
  const [isSignIn, setIsSignIn] = useState(initialMode === "signin");
  const [fadeState, setFadeState] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (isSignIn) {
      handleSignIn(data);
    } else {
      handleSignUp(data);
    }
  };

  const handleSignIn = async (data: FormData) => {
    try {
      const result = await loginApi({
        utorid: data.get("utorid") as string,
        password: data.get("password") as string,
      });

      login(result.token);

      // invalidate user query to trigger a fetch
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

      toast.success("Login successful!", {
        description: "You are now logged in.",
      });

      navigate("/");
    } catch (error) {
      toast.error("Login failed", {
        description: "Please check your credentials and try again.",
      });
    }
  };

  // TODO: Implement signup
  const handleSignUp = async (data: FormData) => {
    try {
      throw new Error("not implemented");
      // Replace this with your actual signup API call
      // const response = await fetch(`${config.server.apiUrl}/auth/signup`, { ... });

      toast.success("Account created successfully!", {
        description: "You can now sign in with your new account.",
      });

      // Toggle to sign in mode after successful registration
      toggleMode();
    } catch (error) {
      toast.error("Registration failed", {
        description:
          "There was a problem creating your account. Please try again.",
      });
    }
  };

  // Toggle between sign-in and sign-up modes with animation
  const toggleMode = () => {
    setFadeState(true);

    // After fade out completes, change the mode
    setTimeout(() => {
      setIsSignIn(!isSignIn);

      // Fade back in
      setTimeout(() => {
        setFadeState(false);
      }, 50);
    }, 400);
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <FadeTransition className={fadeState ? "fade-out" : ""}>
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
            >
              {isSignIn ? "Sign in" : "Sign up"}
            </Typography>
          </FadeTransition>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="utorid">UTORid</FormLabel>
              <TextField
                required
                fullWidth
                id="utorid"
                name="utorid"
                autoComplete="username"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                type="password"
                id="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                variant="outlined"
              />
            </FormControl>

            <Button type="submit" fullWidth variant="contained">
              <FadeTransition className={fadeState ? "fade-out" : ""}>
                {isSignIn ? "Sign in" : "Sign up"}
              </FadeTransition>
            </Button>
          </Box>

          <Divider>
            <Typography sx={{ color: "text.secondary" }}>or</Typography>
          </Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FadeTransition className={fadeState ? "fade-out" : ""}>
              <Typography sx={{ textAlign: "center" }}>
                {isSignIn
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={toggleMode}
                  variant="body2"
                  sx={{ alignSelf: "center" }}
                >
                  {isSignIn ? "Sign up" : "Sign in"}
                </Link>
              </Typography>
            </FadeTransition>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
