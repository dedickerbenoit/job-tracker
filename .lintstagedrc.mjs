export default {
  "frontend/**/*.{ts,tsx}": (filenames) => {
    const files = filenames.map((f) => f.replace(/^.*\/frontend\//, "")).join(" ");
    return [
      `cd frontend && npx eslint --fix ${files}`,
      `npx prettier --write ${filenames.join(" ")}`,
    ];
  },
  "extension/**/*.js": (filenames) => {
    const files = filenames.map((f) => f.replace(/^.*\/extension\//, "")).join(" ");
    return [
      `cd extension && npx eslint --fix ${files}`,
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
