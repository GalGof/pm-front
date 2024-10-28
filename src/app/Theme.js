import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    button: {
      textTransform: 'none',
    }
  },
  components: {
    MuiTypography: {
      defaultProps: {
        alignContent: "center",
      },
    },
    MuiSvgIcon: {
      defaultProps: {
        fontSize: "small",
      }
    },
    MuiButton: {
      defaultProps: {
        variant: "contained",
        size: "small",
        className: "button-custom",
      }
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      }
    },
    MuiChip: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small"
      }
    },
  }
});