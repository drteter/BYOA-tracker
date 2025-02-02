export default {
  expo: {
    name: "habit-tracker",
    // ... other existing config
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
      baseUrl: "/habit-tracker" // replace with your repo name
    }
  }
}; 