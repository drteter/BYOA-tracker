export default {
  expo: {
    name: "BYOA-tracker",
    slug: "BYOA-tracker",
    version: "1.0.0",
    web: {
      bundler: "webpack",
      output: "static",
      publicPath: "/BYOA-tracker/",
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    }
  }
}; 