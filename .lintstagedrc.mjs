export default {
  "frontend/**/*.{ts,tsx}": (filenames) => {
    return [
      `frontend/node_modules/.bin/eslint -c frontend/eslint.config.js --fix ${filenames.join(" ")}`,
      `npx prettier --write ${filenames.join(" ")}`,
    ];
  },
  "extension/**/*.js": (filenames) => {
    return [
      `extension/node_modules/.bin/eslint -c extension/eslint.config.mjs --fix ${filenames.join(" ")}`,
      `npx prettier --write ${filenames.join(" ")}`,
    ];
  },
  "backend/**/*.php": (filenames) => {
    const files = filenames.map((f) => f.replace(/^.*\/backend\//, "")).join(" ");
    return [`cd backend && vendor/bin/pint ${files}`];
  },
  "**/*.{json,yml,yaml,css,html,md}": (filenames) => {
    return [`npx prettier --write ${filenames.join(" ")}`];
  },
};
