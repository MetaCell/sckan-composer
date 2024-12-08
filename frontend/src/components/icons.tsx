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

export const CheckedItemIconBG = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 16 16" sx={{ width: 16, height: 16 }}>
    <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="#C6D9F6"/>
    <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#3779E1"/>
  </SvgIcon>
);

export const ViaIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 24 24"
    sx={{
      width: props.width ? props.width : 24,
      height: props.height ? props.height : 24,
    }}
  >
    <g clipPath="url(#clip0_2956_213155)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.149 19.7649C17.4753 20.1473 18.0499 20.1927 18.4323 19.8664L21.6056 16.6193C21.988 16.293 22.0335 15.7184 21.7071 15.336C21.3808 14.9536 20.8062 14.9081 20.4238 15.2345L18.6426 17.2934C18.4845 17.085 18.2382 16.9459 17.9563 16.9337C17.7129 16.9232 17.4877 17.0093 17.3177 17.158L15.3358 15.2379C15.0095 14.8555 14.4349 14.81 14.0525 15.1364C13.6701 15.4627 13.6246 16.0373 13.951 16.4197L17.149 19.7649ZM17.9738 16.0863C18.4765 16.0847 18.8828 15.6759 18.8812 15.1731C18.8785 14.3243 18.8559 13.3981 18.7989 12.455C18.7686 11.9532 18.3372 11.5709 17.8354 11.6012C17.3336 11.6316 16.9514 12.0629 16.9817 12.5648C17.0361 13.4663 17.058 14.3571 17.0606 15.1789C17.0622 15.6817 17.4711 16.0879 17.9738 16.0863ZM17.7574 10.7566C18.2546 10.6824 18.5976 10.2192 18.5234 9.72196C18.3786 8.75184 18.1769 7.80622 17.8949 6.96589C17.735 6.48926 17.219 6.23251 16.7424 6.39242C16.2658 6.55233 16.009 7.06835 16.1689 7.54498C16.4061 8.25191 16.5877 9.08585 16.7227 9.99069C16.7969 10.4879 17.2602 10.8309 17.7574 10.7566ZM12.4025 5.5875C12.7154 5.98096 13.2881 6.04623 13.6816 5.73329C13.9241 5.54041 14.1606 5.45746 14.4262 5.46184C14.6769 5.46598 14.8935 5.54675 15.1044 5.7143C15.498 6.02704 16.0707 5.96148 16.3834 5.56785C16.6961 5.17423 16.6306 4.6016 16.237 4.28886C15.7387 3.89296 15.1406 3.65281 14.4563 3.64151C13.7196 3.62934 13.0803 3.88526 12.5483 4.30843C12.1548 4.62138 12.0896 5.19403 12.4025 5.5875Z"
        fill={props.fill ? props.fill : "#344054"}
      />
      <path
        d="M3.08635 6.75923C3.58662 6.70945 3.95181 6.26355 3.90203 5.76328C3.86241 5.3651 3.83397 5.0442 3.81548 4.82361C3.80624 4.71333 3.7995 4.62817 3.79509 4.571L3.79022 4.50662L3.78907 4.49086L3.7888 4.48721C3.7532 3.98573 3.31776 3.60727 2.81628 3.64287C2.3148 3.67847 1.93713 4.11386 1.97273 4.61534L1.97324 4.62243L1.9746 4.6409L1.97989 4.7109C1.98459 4.7719 1.99166 4.8611 2.00126 4.97561C2.02044 5.2046 2.04974 5.53498 2.0904 5.94355C2.14018 6.44382 2.58608 6.80901 3.08635 6.75923Z"
        fill={props.fill ? props.fill : "#344054"}
      />
      <path
        d="M7.48023 17.918C7.37154 17.9257 7.21585 17.8954 6.98538 17.6816C6.61678 17.3397 6.04082 17.3614 5.69894 17.73C5.35707 18.0986 5.37873 18.6746 5.74733 19.0164C6.23373 19.4676 6.86205 19.7872 7.60964 19.7339C8.44648 19.6743 9.04651 19.1778 9.45543 18.583C9.74025 18.1687 9.6353 17.602 9.22101 17.3172C8.80674 17.0324 8.24001 17.1373 7.95519 17.5516C7.7435 17.8595 7.58759 17.9103 7.48023 17.918Z"
        fill={props.fill ? props.fill : "#344054"}
      />
      <path
        d="M5.36647 16.9617C5.83443 16.778 6.06486 16.2497 5.88114 15.7817C5.60624 15.0815 5.35947 14.2667 5.14021 13.392C5.01796 12.9044 4.52354 12.6082 4.03589 12.7304C3.54824 12.8527 3.25202 13.3471 3.37427 13.8348C3.60552 14.7572 3.87422 15.6517 4.18648 16.4471C4.3702 16.915 4.8985 17.1455 5.36647 16.9617Z"
        fill={props.fill ? props.fill : "#344054"}
      />
      <path
        d="M3.874 11.9457C4.36867 11.8559 4.69694 11.3822 4.60722 10.8875C4.44765 10.0078 4.3147 9.13942 4.20555 8.33856C4.13766 7.84042 3.67881 7.49164 3.18068 7.55953C2.68254 7.62742 2.33376 8.08627 2.40165 8.58441C2.51362 9.406 2.6506 10.3013 2.81586 11.2124C2.90559 11.7071 3.37933 12.0354 3.874 11.9457Z"
        fill={props.fill ? props.fill : "#344054"}
      />
      <path
        d="M9.47756 16.2656C9.9693 16.3702 10.4527 16.0564 10.5573 15.5646C10.7484 14.6665 10.9012 13.6711 11.0466 12.6718C11.1189 12.1743 10.7743 11.7123 10.2768 11.64C9.7793 11.5676 9.31733 11.9122 9.24496 12.4097C9.09966 13.4086 8.95402 14.3516 8.77657 15.1859C8.67197 15.6776 8.98582 16.161 9.47756 16.2656Z"
        fill={props.fill ? props.fill : "#344054"}
      />
      <path
        d="M10.4223 10.5945C10.9182 10.6774 11.3873 10.3425 11.4702 9.84668C11.635 8.86005 11.8209 7.94144 12.0562 7.14817C12.1992 6.66619 11.9244 6.15955 11.4425 6.01656C10.9605 5.87357 10.4538 6.14837 10.3108 6.63034C10.0443 7.52877 9.84402 8.53197 9.67448 9.54663C9.59162 10.0425 9.92643 10.5116 10.4223 10.5945Z"
        fill={props.fill ? props.fill : "#344054"}
      />
    </g>
    <defs>
      <clipPath id="clip0_2956_213155">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </SvgIcon>
);
export const DestinationIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 24 24"
    sx={{
      width: props.width ? props.width : 24,
      height: props.height ? props.height : 24,
    }}
  >
    <path
      d="M2 10.6374C2.56711 10.6374 4.35539 10.6374 4.35539 10.6374C4.71223 7.09492 6.77671 3.90601 9.92162 2.14095C10.452 1.84351 11.1222 2.03227 11.4196 2.56181C11.717 3.09157 11.5283 3.76213 10.9987 4.05957C8.22365 5.61673 6.49995 8.55858 6.49995 11.7374C6.49995 14.9159 8.22365 17.8578 10.9983 19.4149C11.5281 19.7126 11.7166 20.3827 11.4189 20.9129C11.2174 21.2724 10.8439 21.4748 10.4589 21.4748C10.2767 21.4748 10.0919 21.4295 9.92162 21.3338C6.77671 19.5689 4.71223 16.3798 4.35539 12.8374C4.35539 12.8374 2.56711 12.8374 2 12.8374C1.43289 12.8374 1 12.4747 1 11.7374C1 11 1.43289 10.6374 2 10.6374Z"
      fill={props.fill ? props.fill : "#0C2751"}
    />
    <path
      d="M22.5605 12H19.0605"
      stroke={props.fill ? props.fill : "#0C2751"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="-1"
      y="1"
      width="8"
      height="8"
      rx="4"
      transform="matrix(-1 0 0 1 17.5605 7)"
      stroke={props.fill ? props.fill : "#0C2751"}
      strokeWidth="2"
      fill="#fff"
    />
  </SvgIcon>
);
export const OriginIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 24 24"
    sx={{
      width: props.width ? props.width : 24,
      height: props.height ? props.height : 24,
    }}
  >
    <path
      d="M12 22C15 22 21 16.246 21 10.8298C21 5.41358 17.1951 1 12 1C6.80486 1 3 5.41358 3 10.8298C3 16.246 9 22 12 22ZM12 2.96596C16.158 2.96596 19.2857 6.49485 19.2857 10.8298C19.2857 15.1647 14.1429 19.766 12 19.766C9.85714 19.766 4.71429 15.1647 4.71429 10.8298C4.71429 6.49485 7.842 2.96596 12 2.96596Z"
      fill={props.fill ? props.fill : "#344054"}
    />
    <circle
      cx="12"
      cy="11"
      r="3"
      stroke={props.fill ? props.fill : "#344054"}
      strokeWidth="2"
      fill="#fff"
    />
  </SvgIcon>
);

export const OriginInfoIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 36 26"
    sx={{
      width: props.width ? props.width : 36,
      height: props.height ? props.height : 36,
    }}
  >
    <g filter="url(#filter0_di_3328_77745)">
      <rect x="6" y="2" width="24" height="24" rx="12" fill="#ECFDF3" />
      <rect
        x="7"
        y="3"
        width="22"
        height="22"
        rx="11"
        stroke="#039855"
        strokeWidth="2"
      />
    </g>
    <defs>
      <filter
        id="filter0_di_3328_77745"
        x="0"
        y="0"
        width="36"
        height="36"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius="4"
          operator="erode"
          in="SourceAlpha"
          result="effect1_dropShadow_3328_77745"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.0121568 0 0 0 0 0.595686 0 0 0 0 0.333098 0 0 0 0.2 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3328_77745"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3328_77745"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="13" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.65098 0 0 0 0 0.956863 0 0 0 0 0.772549 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3328_77745"
        />
      </filter>
    </defs>
  </SvgIcon>
);
export const ViaInfoIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 36 26"
    sx={{
      width: props.width ? props.width : 36,
      height: props.height ? props.height : 36,
    }}
  >
    <g filter="url(#filter0_di_3328_77749)">
      <rect x="6" y="2" width="24" height="24" rx="8" fill="#F0FDF9" />
      <rect
        x="7"
        y="3"
        width="22"
        height="22"
        rx="7"
        stroke="#0E9384"
        strokeWidth="2"
      />
    </g>
    <defs>
      <filter
        id="filter0_di_3328_77749"
        x="0"
        y="0"
        width="36"
        height="36"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius="4"
          operator="erode"
          in="SourceAlpha"
          result="effect1_dropShadow_3328_77749"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.054902 0 0 0 0 0.576471 0 0 0 0 0.517647 0 0 0 0.2 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3328_77749"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3328_77749"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="13" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.6 0 0 0 0 0.964706 0 0 0 0 0.878431 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3328_77749"
        />
      </filter>
    </defs>
  </SvgIcon>
);
export const DestinationInfoIcon = (props: SvgIconProps) => (
  <SvgIcon
    {...props}
    viewBox="0 0 36 26"
    sx={{
      width: props.width ? props.width : 36,
      height: props.height ? props.height : 36,
    }}
  >
    <g filter="url(#filter0_di_3328_77753)">
      <rect x="6" y="2" width="24" height="24" rx="4" fill="#ECFDFF" />
      <rect
        x="7"
        y="3"
        width="22"
        height="22"
        rx="3"
        stroke="#088AB2"
        strokeWidth="2"
      />
    </g>
    <defs>
      <filter
        id="filter0_di_3328_77753"
        x="0"
        y="0"
        width="36"
        height="36"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology
          radius="4"
          operator="erode"
          in="SourceAlpha"
          result="effect1_dropShadow_3328_77753"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.0313726 0 0 0 0 0.541176 0 0 0 0 0.698039 0 0 0 0.2 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3328_77753"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3328_77753"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="13" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.647059 0 0 0 0 0.941176 0 0 0 0 0.988235 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3328_77753"
        />
      </filter>
    </defs>
  </SvgIcon>
);
