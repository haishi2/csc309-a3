//code from:
//https://github.com/mui/material-ui/tree/v7.0.1/docs/data/material/getting-started/templates/sign-in
import * as React from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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

export default function AuthForm(props: {
  disableCustomTheme?: boolean;
}) {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    handleSignIn(data);
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

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Sign in
          </Typography>

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
                autoComplete="current-password"
                variant="outlined"
              />
            </FormControl>

            <Button type="submit" fullWidth variant="contained">
              Sign in
            </Button>
          </Box>

          <Divider>
            <Typography sx={{ color: "text.secondary" }}>or</Typography>
          </Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ textAlign: "center" }}>
              New user? {" "}
              <Link
                component={RouterLink}
                to="/set-password"
                variant="body2"
                sx={{ alignSelf: "center" }}
              >
                Set your password
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
