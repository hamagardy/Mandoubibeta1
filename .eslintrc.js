module.exports = {
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    // Disable rules that might cause build failures
    "no-unused-vars": "warn",
    "no-undef": "warn"
  },
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  }
};