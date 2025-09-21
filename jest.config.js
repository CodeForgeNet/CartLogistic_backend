module.exports = {
  reporters: [
    "default",
    ["jest-md-dashboard", {
      "outputPath": "./test-results/test-report.md",
      "pageTitle": "Backend Test Report",
      "includeFailureData": true
    }]
  ]
};