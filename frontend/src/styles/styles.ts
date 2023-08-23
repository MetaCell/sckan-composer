export const useGutters = () => ({
  padding: {
    lg: '3rem',
    xl: '3rem 6rem',
  }
});

export const useSectionStyle = (theme: any) => ({
  background: theme.palette.common.white,
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: "12px",
  boxShadow: "none",
  padding: theme.spacing(3)
})

export const useGreyBgContainer = (theme: any) => ({
  background: theme.palette.background.default,
  borderRadius: '12px',
  padding: theme.spacing(1)
})