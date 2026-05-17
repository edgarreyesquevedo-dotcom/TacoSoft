/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        masa: '#f7f2e8',
        salsa: '#c83f2f',
        nopal: '#2f6f4f',
        maiz: '#f2b84b'
      },
      boxShadow: {
        soft: '0 16px 45px rgba(23, 33, 27, 0.10)'
      }
    }
  },
  plugins: []
};
