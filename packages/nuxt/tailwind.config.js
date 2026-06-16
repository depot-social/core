// /** @type {import('tailwindcss').Config} */

// // depot light color scheme based on official tailwind
// // color palette (https://tailwindcss.com/docs/customizing-colors).
// // @see Penpot > depot 3.0 screendesign > Colors
// const amber100 = '#fef3c7';
// const amber200 = '#fde68a';
// const amber300 = '#fcd34d';
// const amber400 = '#fbbf24';
// const amber500 = '#fcd34d';
// const amber600 = '#f59e0b';
// const amber700 = '#d97706';
// const amber800 = '#b45309';

// const green100 = '#dcfce7'; // Try somewhere here #D8EDE8
// const green200 = '#bbf7d0';
// const green300 = '#86efac';
// const green400 = '#4ade80';
// const green500 = '#22c55e';
// const green600 = '#16a34a';
// const green800 = '#15803d';

// const cyan100 = '#dffffc';
// const cyan200 = '#a0fff5';
// const cyan300 = '#72f8ef';
// const cyan700 = '#00afc5';
// const cyan800 = '#006e80';

// const orange100 = '#fff2e1';
// const orange200 = '#fed7aa';
// const orange300 = '#fdba74';
// const orange400 = '#fb923c';
// const orange500 = '#f97316';
// const orange600 = '#ea580c';
// const orange700 = '#d8340a';
// const orange800 = '#d8340a';

// const grey100 = '#f4f4f4';
// const grey200 = '#d9d9d9';
// const grey400 = '#d9d9d9';
// const grey500 = '#7f7f7f';
// const grey700 = '#575757';

// const white = '#ffffff';
// const black = '#141415';

// module.exports = {
//   content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
//   theme: {
//     extend: {
//       borderRadius: {
//         '2xl': '35px',
//         '3xl': '70px',
//       },
//       colors: {
//         white: white,
//         black: black,
//         gray: {
//           100: grey100,
//           200: grey200,
//           300: grey400,
//           400: grey400,
//           500: grey500,
//           600: grey500,
//           700: grey700,
//           800: grey700,
//         },
//         orange: {
//           100: orange100,
//           200: orange200,
//           300: orange300,
//           400: orange400,
//           500: orange500,
//           600: orange600,
//           700: orange700,
//           800: orange800,
//         },
//         blue: {
//           100: cyan100,
//           200: cyan200,
//           300: cyan300,
//           700: cyan700,
//           800: cyan800,
//         },
//         green: {
//           100: green100,
//           200: green200,
//           300: green300,
//           400: green400,
//           500: green500,
//           600: green600,
//           800: green800,
//         },
//         amber: {
//           100: amber100,
//           200: amber200,
//           300: amber300,
//           400: amber400,
//           500: amber500,
//           600: amber600,
//           700: amber700,
//           800: amber800,
//         },
//       },
//       keyframes: {
//         fadein: {
//           '0%': { opacity: '0.1', transform: 'scale(0.5)' },
//           '100%': { opacity: '1', transform: 'scale(1)' },
//         },
//       },
//       animation: {
//         fadein: 'fadein 0.7s ease-in-out forwards',
//       },
//     },
//     container: {
//       center: true,
//       padding: {
//         DEFAULT: '1rem',
//         sm: '2rem',
//         lg: '4rem',
//         xl: '5rem',
//         '2xl': '6rem',
//       },
//     },
//     fontFamily: {
//       sans: ['Unbounded', 'Arial', 'sans-serif'],
//       text: ['Poppins', 'Arial', 'sans-serif'],
//     },
//     fontSize: {
//       /** @todo clamp for xl, 2xl & 4xl! */
//       xs: [
//         '12px',
//         {
//           lineHeight: '1.2',
//           letterSpacing: '0',
//           fontWeight: 'normal',
//         },
//       ],
//       sm: [
//         '14px',
//         {
//           lineHeight: '1.4',
//           letterSpacing: '0',
//           fontWeight: 'normal',
//         },
//       ],
//       base: [
//         '16px',
//         {
//           lineHeight: '1.6',
//           letterSpacing: '0',
//           fontWeight: 'normal',
//         },
//       ],
//       dynamic: [
//         '20px',
//         {
//           lineHeight: '1.6',
//           letterSpacing: '0',
//         },
//       ],
//       lg: [
//         '20px',
//         {
//           lineHeight: '1.6',
//           letterSpacing: '0',
//           fontWeight: 'normal',
//         },
//       ],
//       '2lg': [
//         '22px',
//         {
//           lineHeight: '1.5',
//           letterSpacing: '0',
//           fontWeight: '500',
//         },
//       ],
//       xl: [
//         '30px',
//         {
//           lineHeight: '1.3',
//           letterSpacing: '0',
//           fontWeight: '500',
//         },
//       ],
//       '2xl': [
//         '34px',
//         {
//           lineHeight: '1.3',
//           letterSpacing: '0',
//           fontWeight: '500',
//         },
//       ],
//       '3xl': [
//         '42px',
//         {
//           lineHeight: '1.3',
//           letterSpacing: '-0.5',
//           fontWeight: '500',
//         },
//       ],
//     },
//   },
//   daisyui: {
//     themes: [
//       {
//         // @see https://daisyui.com/docs/themes/
//         depotLight: {
//           // "color-scheme": "light",
//           primary: orange800,
//           secondary: grey200,
//           accent: green200,
//           neutral: orange100,
//           'base-100': orange100,
//           info: white,
//           success: green500,
//           warning: orange400,
//           error: '#e60400',
//           '--btn-text-case': 'normal',
//           '--rounded-btn': '99px',
//         },
//       },
//     ],
//   },
//   plugins: [require('daisyui')],
// };
