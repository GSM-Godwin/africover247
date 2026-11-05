const { withPodfile } = require("@expo/config-plugins");

const MODULAR_PODS = [
  "GoogleUtilities",
  "FirebaseCore",
  "FirebaseCoreInternal",
  "FirebaseCoreExtension",
  "FirebaseInstallations",
  "FirebaseMessaging",
  "GoogleDataTransport",
  "nanopb",
  "PromisesObjC",
];

module.exports = function withRNFirebaseFixes(config) {
  return withPodfile(config, (c) => {
    let contents = c.modResults.contents;

    if (!contents.includes("$RNFirebaseDisableSPM")) {
      contents = "$RNFirebaseDisableSPM = true\n" + contents;
    }

    if (!contents.includes("GoogleUtilities', :modular_headers")) {
      const lines = MODULAR_PODS.map(
        (name) => `  pod '${name}', :modular_headers => true`
      ).join("\n");
      contents = contents.replace(
        /(target '[^']+' do\n)/,
        `$1${lines}\n`
      );
    }

    c.modResults.contents = contents;
    return c;
  });
};