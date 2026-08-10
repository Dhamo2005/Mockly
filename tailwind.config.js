/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.12' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
      },
      animation: {
        ripple: 'ripple 350ms cubic-bezier(0.2, 0, 0, 1) forwards',
      },
    },
  },
  plugins: [],
};
