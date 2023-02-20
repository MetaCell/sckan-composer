import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export const UncheckedItemIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 16 16" sx={{ width: 16, height: 16 }}>
    <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="white" />
    <rect
      x="0.5"
      y="0.5"
      width="15"
      height="15"
      rx="3.5"
      stroke="#D0D5DD"
      fill="none"
    />
  </SvgIcon>
);

export const CheckedItemIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 16 16" sx={{ width: 16, height: 16 }}>
    <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="#E2ECFB" />
    <path
      d="M12 5L6.5 10.5L4 8"
      stroke="#3779E1"
      strokeWidth="1.6666"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <rect
      x="0.5"
      y="0.5"
      width="15"
      height="15"
      rx="3.5"
      stroke="#3779E1"
      fill="none"
    />
  </SvgIcon>
);
