module.exports = api => {
  // "isTest" can be used to determine what presets and plugins to use.
  const isTest = api.env('test');

  const presets = ['@babel/preset-env'];
  const plugins = [
    '@babel/plugin-syntax-jsx',
    "@babel/plugin-transform-property-mutators",
    ["@babel/plugin-proposal-private-methods", {"loose": true}],
    ["@babel/plugin-proposal-class-properties", {"loose": true}],
    ['@babel/plugin-transform-react-jsx', {'pragma': '__h', 'pragmaFrag': 'Fragment'}]
  ];

  return {presets, plugins};
};
