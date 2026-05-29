/** @type {import('tailwindcss').Config} */
// Tokens lifted from the Alto design system (Avios Figma) so the sandbox
// visually resembles the help-centre redesign.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Alto colour tokens (alto/sem/color/*)
        bg: {
          base: '#fefefe',
          layer1: '#f8f8fa',
          layer2: '#fefefe',
          layer3: '#edecf1',
        },
        fg: {
          primary: '#000000',
          secondary: '#4b4855',
          tertiary: '#737177',
          'accent-primary': '#011dac',
          'accent-secondary': '#001e62',
          'on-vibrant': '#fefefe',
        },
        border: {
          DEFAULT: '#9593a0',
          secondary: '#9593a080',
          tertiary: '#9593a040',
          accent: '#011dac',
        },
        accent: {
          vibrant: '#011dac',
          subtle: '#e2e8ff',
        },
        info: {
          subtle: '#d8ecff',
        },
        // OpCo brand-ish accents for badges
        opco: {
          ba: '#075aaa',
          aer: '#006a4e',
          iberia: '#d52b1e',
        },
      },
      fontFamily: {
        // Poppins for body + labels (per Alto). Bw Mitga is the brand display
        // font; we use Poppins for headings too since Bw Mitga is licensed and
        // not available on Google Fonts — close enough for the sandbox.
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '2px',
        sm: '6px',
        md: '8px',
        card: '12px',
        pill: '9999px',
      },
      boxShadow: {
        elevation1: '0 1px 2px 0 rgba(1,30,98,0.02), 0 4px 8px 0 rgba(1,30,98,0.02)',
        elevation3: '0 4px 8px 0 rgba(1,30,98,0.06), 0 12px 24px 0 rgba(1,30,98,0.08)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};
