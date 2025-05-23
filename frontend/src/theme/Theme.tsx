import { createTheme } from "@mui/material/styles";
import { vars } from "./variables";

const {
  primaryFont,
  titleFont,
  bodyBgColor,
  colorPrimary,
  borderRadius,
  titleFontColor,
  grey400,
  topbarShadow,
  menuItemSelectedBg,
  captionColor,
  iconPrimaryColor,
  buttonOutlinedColor,
  buttonOutlinedBorderColor,
  buttonOutlinedHoverBg,
  labelColor,
  radioBorderColor,
  inputPlaceholderColor,
} = vars;

const theme = createTheme({
  palette: {
    background: {
      default: bodyBgColor,
    },
    primary: {
      main: colorPrimary,
      light: "#E2ECFB",
      dark: "#184EA2",
    },
    info: {
      main: "#344054",
      light: "#F2F4F7",
    },
    success: {
      main: "#027A48",
      light: "#ECFDF3",
    },
    error: {
      main: "#B42318",
      light: "#FEF3F2",
    },
    warning: {
      main: "#B54708",
      light: "#FFFAEB",
    },
    text: {
      primary: "#475467",
      disabled: "",
    },
    grey: {
      50: "#F9FAFB",
      100: "#F2F4F7",
      200: "#EAECF0",
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
    h4: {
      fontWeight: 600,
      fontSize: "1.125rem",
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
      .MuiDataGrid-columnHeaderTitle {
        font-size: 0.75rem;
        color: #475467;
      }
      .MuiDataGrid-footerContainer {
        background: #fff;
        border-radius: 0 0 12px 12px;
        padding: 1rem 1.5rem;
        min-height: auto !important;
      }
      .MuiDataGrid-main {
        background: #fff;
      },
      .MuiDataGrid-cell {
        font-feature-settings: 'ss01' on, 'cv10' on, 'cv09' on;
        padding: 8px 10px !important;
        color: ${menuItemSelectedBg};
      },
      .MuiDataGrid-row:last-child > .MuiDataGrid-cell {
        border-bottom: 0;
      },
      .inLineForm > div > div > .MuiGrid-container{
        display: grid;
        grid-template-columns: 1fr 3fr 3fr;
        align-items: center;
        margin-top: 0 !important;
      }
      .inLineForm > div > div > .MuiGrid-container > .MuiGrid-item{
        padding-top: 0 !important;
        margin: 0 !important;
      }
      .vias > div > div > .MuiGrid-container{
        margin-top: -16px !important;
      }
      .vias > div > div > .MuiGrid-container> .MuiGrid-item{
        margin: 0 !important;
      }
      .destinations > div > div > .MuiGrid-container{
        margin-top: -16px !important;
      }
      .destinations > div > div > .MuiGrid-container> .MuiGrid-item{
        margin: 0 !important;
      }
      .ks > div > div > .MuiGrid-container{
        margin-top: -16px !important;
      }
      .ks > div > div > .MuiGrid-container> .MuiGrid-item{
        margin: 0 !important;
      }
      .provenance > div > div > .MuiGrid-container{
        margin-top: -16px !important;
      }
      .provenance > div > div > .MuiGrid-container> .MuiGrid-item{
        margin: 0 !important;
      }
      div[id^="root_path_"]{
        display : none
      }
      .MuiFormLabel-root{
        margin-bottom: 16px;
      }
  
      * {
        scroll-margin-top: 3rem;
      }
      
      .MuiBox-root:has(.origins) {
        flex: 2
      }
      
      .MuiBox-root:has(.alerts-form) {
        flex: 1;
      }
      
      .alerts-form .MuiBox-root {
      padding: 0;
      margin: 0
      }
      
      .alerts-form .MuiPaper-root {
        box-shadow: none;
        border: 0;
      }
      .alerts-form .MuiPaper-root:has(.Mui-focused) {
        box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);
        border: 1px solid #EAECF0;
      }
      
      `,
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
        textInfo: {
          color: "#475467",
        },

        outlined: {
          color: buttonOutlinedColor,
          borderColor: buttonOutlinedBorderColor,
        },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
        groupedContained: {
          "&:not(:last-of-type)": {
            borderRight: "none",
          },
          "&:not(:first-of-type)": {
            padding: 0,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
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
          "&:focus-within fieldset, &:focus-visible fieldset": {
            border: "1px solid #8DB2EE !important",
            boxShadow:
              "0px 1px 2px rgba(16, 24, 40, 0.05), 0px 0px 0px 4px #CEDDED",
          },
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
    MuiPagination: {
      styleOverrides: {
        ul: {
          "& li:last-child": { marginLeft: "auto" },
          "& li:first-of-type": { marginRight: "auto" },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        previousNext: ({ theme }) => ({
          padding: theme.spacing(1, 1.5),
          border: `1px solid ${buttonOutlinedBorderColor}`,
          "&:hover": {
            background: buttonOutlinedHoverBg,
          },
        }),
        page: {
          fontWeight: 500,
          fontFeatureSettings: "'ss01' on, 'cv10' on, 'cv09' on;",
          "&.Mui-selected": {
            background: bodyBgColor,
          },
          "&.Mui-selected:hover": {
            background: bodyBgColor,
          },
          "&:hover": {
            background: bodyBgColor,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        filled: ({ theme }) => ({
          fontSize: "0.875rem",
          fontWeight: 500,
          padding: "0 2px",
          "&.MuiChip-filledWarning": {
            background: theme.palette.warning.light,
            color: theme.palette.warning.main,
          },
          "&.MuiChip-filledSuccess": {
            background: theme.palette.success.light,
            color: theme.palette.success.main,
          },
          "&.MuiChip-filledError": {
            background: theme.palette.error.light,
            color: theme.palette.error.main,
          },
          "&.MuiChip-filledInfo": {
            background: theme.palette.info.light,
            color: theme.palette.info.main,
          },
        }),
        filledPrimary: ({ theme }) => ({
          background: theme.palette.primary.light,
          color: theme.palette.primary.dark,
        }),
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          "& .costume-dois": {
            "& .MuiPaper-root": {
              boxShadow: "none",
            },
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: labelColor,
          fontWeight: 500,
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          "& .MuiSvgIcon-root": {
            fontSize: "1rem",
            color: radioBorderColor,
            filter: "contrast(.7)",

            "&:nth-of-type(2)": {
              fill: inputPlaceholderColor,
            },
          },
        },
      },
    },
    MuiFormGroup: {
      styleOverrides: {
        root: {
          "& .MuiFormControlLabel-root": {
            color: labelColor,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: "500",
          fontSize: "0.875rem",
          lineHeight: "20px",
          color: "#344054",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {},
        input: {
          "&::placeholder": {
            color: inputPlaceholderColor,
            opacity: 1,
            fontWeight: "400",
            fontSize: "14px",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
        textColorPrimary: ({ theme }) => ({
          "&.Mui-selected": { color: theme.palette.primary.dark },
          fontWeight: 600,
          "&.Mui-disabled": { color: theme.palette.grey[400] },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: ({ theme }) => ({
          backgroundColor: theme.palette.primary.dark,
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          padding: 0,
          cursor: 'default',
          
          '& .MuiAlert-message, & .MuiAlert-icon': {
            padding: 0
          },
          
          '& .MuiAlert-icon': {
            marginRight: '4px'
          },
          
          '&.MuiAlert-standardWarning': {
            '& .MuiAlert-message': {
              color: vars.warning600,
              fontSize: '0.75rem',
              fontWeight: 600,
              lineHeight: '1.125rem',
            },
            '& .MuiAlert-icon': {
              '& .MuiSvgIcon-root': {
                color: vars.warning600,
                fontSize: '1rem',
              }
            }
          }
        }
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#101828',
          padding: '0.75rem',
          fontWeight: 600,
          fontSize: '0.75rem'
        },
        arrow: {
          color: '#101828'
        }
      },
    },
  },
});

export default theme;
