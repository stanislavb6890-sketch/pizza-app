import type { Config } from 'tailwindcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const config: Config = {
  plugins: {
    tailwindcss,
    autoprefixer,
  },
};

export default config;
