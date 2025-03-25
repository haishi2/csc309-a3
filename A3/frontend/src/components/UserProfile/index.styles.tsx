import { styled } from "@mui/material/styles";
import { Card, Avatar, Box } from "@mui/material";

const ProfileCard = styled(Card)(({ theme }) => ({
  maxWidth: 1000,
  margin: "0 auto",
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  boxShadow: "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px",
  ...theme.applyStyles("dark", {
    boxShadow: "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px",
  }),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  marginBottom: theme.spacing(2),
}));

const QRCodeContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  backgroundColor: "#fff",
  borderRadius: theme.shape.borderRadius,
}));

export { ProfileCard, ProfileAvatar, QRCodeContainer };
