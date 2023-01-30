import { createTheme } from "@mui/material/styles";
import { vars } from "./variables";

const {
  primaryFont,
  titleFont,
  bodyBgColor,
  colorPrimary,
  borderRadius,
  titleFontColor,
  paperShadow,
  grey400,
  topbarShadow,
  menuItemSelectedBg,
} = vars;

const theme = createTheme({
  palette: {
    background: {
      default: bodyBgColor,
    },
    primary: {
      main: colorPrimary,
    },
    text: {
      primary: "#475467",
      disabled: "",
    },
  },
  shape: {
    borderRadius,
  },
  mixins: {
    toolbar: {
      minHeight: "3rem",
    },
  },
  typography: {
    fontFamily: primaryFont,
    fontSize: 14,
    subtitle1: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    h1: {
      fontFamily: titleFont,
    },
    h3: {
      fontFamily: titleFont,
      fontWeight: 600,
      fontSize: "1.875rem",
      color: titleFontColor,
    },
    h6: {
      fontWeight: 600,
      fontSize: "0.875rem",
    },
    subtitle2: {
      fontWeight: 400,
      fontSize: "1rem",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "0.875rem",
    },
  },
  components: {
    MuiCssBaseline: {},
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          boxShadow: "none",
          borderRadius: "1.5rem",
          padding: theme.spacing(1.25, 3),
          fontSize: "1rem",
          fontWeight: 600,
        }),
        containedSecondary: {
          fontWeight: "600",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: paperShadow,
          borderRadius: "12px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: topbarShadow,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        colorInfo: {
          color: grey400,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            color: "#fff",
            background: menuItemSelectedBg,
          },
          "&:hover": {
            color: "#fff",
            background: menuItemSelectedBg,
          },
        },
      },
    },
  },
});

export default theme;
