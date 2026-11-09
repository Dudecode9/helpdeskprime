export default {
  appId: "com.helpdeskprime.desktop",
  productName: "HelpdeskPrime Desktop",
  directories: {
    output: "dist-electron",
  },
  files: [
    "electron/**/*",
    "backend/**/*",
    "frontend/dist/**/*",
    "db/**/*",
    "docs/**/*",
    "package.json",
    "!**/.env",
    "!**/.env.*",
    "!**/*.log",
    "!**/node_modules/.cache/**",
  ],
  linux: {
    target: ["AppImage"],
    category: "Utility",
    artifactName: "HelpdeskPrime-${version}-linux-${arch}.AppImage",
  },
  extraMetadata: {
    main: "electron/main.js",
  },
  asar: true,
};
