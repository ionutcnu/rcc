import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        alabaster: {
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#FEFEFE',
          300: '#FDFDFD',
          400: '#FCFCFC',
          500: '#FBFBFB',
          600: '#E2E2E2',
          700: '#979797',
          800: '#717171',
          900: '#4B4B4B',
        },
        seance: {
          50: '#F8F3F9',
          100: '#F1E7F3',
          200: '#DDC4E2',
          300: '#C9A1D1',
          400: '#A05AAE',
          500: '#77138B',
          600: '#6B117D',
          700: '#470B53',
          800: '#36093F',
          900: '#24062A',
        },
        candlelight: {
          50: '#FFFDF3',
          100: '#FFFBE6',
          200: '#FEF5C2',
          300: '#FDEF9D',
          400: '#FCE353',
          500: '#FBD709',
          600: '#E2C208',
          700: '#978105',
          800: '#716104',
          900: '#4B4103',
        },
        viola: {
          50: '#FDFAFC',
          100: '#FAF5F8',
          200: '#F4E6EE',
          300: '#EDD7E3',
          400: '#DFBACE',
          500: '#D19CB9',
          600: '#BC8CA7',
          700: '#7D5E6F',
          800: '#5E4653',
          900: '#3F2F38',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
            "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
