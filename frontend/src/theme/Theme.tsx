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
  captionColor,
  iconPrimaryColor,
  buttonOutlinedColor,
  buttonOutlinedBorderColor,
} = vars;

const theme = createTheme({
  palette: {
    background: {
      default: bodyBgColor,
    },
    primary: {
      main: colorPrimary,
    },
    info: {
      main: '#184EA2',
      light: '#ECFDF3',
    },
    success: {
      main: '#027A48',
      light: '#ECFDF3',
    },
    error: {
      main: '#B42318',
      light: '#FEF3F2',
    },
    warning: {
      main: '#B54708',
      light: '#FFFAEB'
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
      fontWeight: 500,
      fontSize: "1.875rem",
      color: titleFontColor,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
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
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      color: captionColor,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
      .MuiDataGrid-row {
        cursor: pointer;
        background: #fff;
      }

      .MuiDataGrid-columnSeparator {
        visibility: hidden;
      }
      .MuiDataGrid-columnHeaders {
        background: #F9FAFB;
        border-radius: 0 !important;
      }
      .MuiDataGrid-footerContainer {
        background: #fff;
        border-radius: 0 0 12px 12px;
      }
      .MuiDataGrid-main {
        background: #fff;
      }`,
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          boxShadow: "none",
          borderRadius: "1.5rem",
          padding: theme.spacing(1.25, 2),
          fontSize: "0.875rem",
          fontWeight: 600,
          lineHeight: "normal",
        }),
        containedSecondary: {
          fontWeight: "600",
        },
        outlinedSecondary: {
          background: "#fff",
          color: buttonOutlinedColor,
          borderColor: buttonOutlinedBorderColor,
          "&:hover": {
            background: "#F9FAFB",
            borderColor: buttonOutlinedBorderColor,
          },
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
    MuiSvgIcon: {
      styleOverrides: {
        colorPrimary: {
          color: iconPrimaryColor,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          border: "1px solid #EAECF0;",
          boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          // "&:hover": {
          //   border: "1px solid #EAECF0;",
          //   boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          //   color: "#EAECF0",
          // },
          // "&:focus": {
          //   border: "1px solid #EAECF0;",
          //   boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          //   color: "#EAECF0",
          // },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
  },
});

export default theme;
