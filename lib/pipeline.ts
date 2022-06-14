import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  GitHubSourceAction,
  S3DeployAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import Config from "./config";
import { FrontendWebsiteStack } from "./stacks/frontend-stack";

export class CharleyByrneComPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const artifacts: { [key: string]: Artifact } = {
      output: new Artifact(),
      source: new Artifact(),
    };

    const repos = {
      cicd: CodePipelineSource.gitHub(
        `${Config.git.user}/${Config.git.ci.repo}`,
        Config.git.ci.branch
      ),
      application: CodePipelineSource.gitHub(
        `${Config.git.user}/${Config.git.app.repo}`,
        Config.git.app.branch
      ),
    };

    const pipeline = new Pipeline(this, "CharleyByrneComPipeline", {
      pipelineName: "CharleyByrneComPipeline",
      crossAccountKeys: false,
    });

    const stacks = new FrontendWebsiteStack(this, "FrontendStack", {
      ...props,
      assets: [],
    });

    const project = new PipelineProject(this, "WebsiteBuilder", {
      projectName: "WebsiteBuilder",
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            "runtime-versions": {
              nodejs: "14",
            },
          },
          pre_build: {
            commands: ["npm ci"],
          },
          build: {
            commands: ["npm run generate"],
          },
        },
        artifacts: {
          "base-directory": "dist",
          files: ["**/*"],
        },
      }),
    });

    const invalidation = new PipelineProject(this, `InvalidateProject`, {
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
            commands: [
              `aws cloudfront create-invalidation --distribution-id ${stacks.distro.cloudfront.distributionId} --paths "/*"`,
            ],
          },
        },
      }),
    });

    invalidation.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${stacks.distro.cloudfront.distributionId}`,
        ],
      })
    );

    project.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:*"],
        resources: [stacks.bucket.bucketArn],
      })
    );

    const actions = {
      source: new GitHubSourceAction({
        owner: Config.git.user,
        repo: Config.git.app.repo,
        branch: "main",
        actionName: "GitHub",
        oauthToken: SecretValue.secretsManager(Config.git.pat),
        output: artifacts.source,
      }),
      build: new CodeBuildAction({
        actionName: "Build",
        project: project,
        input: artifacts.source,
        outputs: [artifacts.output],
      }),
      deploy: new S3DeployAction({
        actionName: "Deploy",
        bucket: stacks.bucket,
        input: artifacts.output,
      }),
      invalidate: new CodeBuildAction({
        actionName: "CloudFrontInvalidation",
        project: invalidation,
        input: artifacts.output,
      }),
    };

    pipeline.addStage({ stageName: "Source", actions: [actions.source] });
    pipeline.addStage({ stageName: "Build", actions: [actions.build] });
    pipeline.addStage({ stageName: "Deploy", actions: [actions.deploy] });
    pipeline.addStage({
      stageName: "Invalidate",
      actions: [actions.invalidate],
    });
  }
}
