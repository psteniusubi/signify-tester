import type { Config } from 'jest';

const config: Config = {
  extensionsToTreatAsEsm: [".ts"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node"
};

export default config;
