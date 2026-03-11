import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 覆盖默认的 zinc 颜色，使用更浅的深色调
        zinc: {
          850: '#1E1F20',
          900: '#1E1F20',
          950: '#131314',
        },
      },
    },
  },
  plugins: [],
};

export default config;
