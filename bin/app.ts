#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CharleyByrneComPipelineStack } from "../lib/pipeline";
import { FrontendWebsiteStack } from "../lib/stacks/frontend-stack";

const app = new cdk.App();

const env = {
  region: "eu-west-1",
  account: process.env.CDK_LOCAL_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
};

// deploy stack on its own with CDK_LOCAL_BUILD=dist to deploy stack directly
new FrontendWebsiteStack(app, "FrontendStack", { env });

new CharleyByrneComPipelineStack(app, "CharleyByrneComPipelineLowLevel", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  env,
});

app.synth();
