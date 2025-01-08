module.exports = {
    verbose: true,
    preset: "jest-puppeteer",
    "testEnvironment": "jsdom",
    transform: {
      "^.+\\.jsx?$": "babel-jest"
    }
    
  };