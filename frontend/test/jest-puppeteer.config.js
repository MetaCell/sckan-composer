module.exports = {
    launch: {
      headless: true,
    // slowMo:20,
      args: ['--no-sandbox'],
      defaultViewport: {
        width: 1000,
        height: 800
      },
      timeout: 120000
    },
  }