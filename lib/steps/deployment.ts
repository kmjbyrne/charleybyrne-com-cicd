import { CfnOutput, CfnResource } from "aws-cdk-lib";
import { IStage } from "aws-cdk-lib/aws-codepipeline";
import { S3DeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  CodePipelineActionFactoryResult,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  Step,
} from "aws-cdk-lib/pipelines";

export class S3DeploymentStep
  extends Step
  implements ICodePipelineActionFactory
{
  constructor(id: string, private bucket: Bucket, private contents?: any) {
    super(id);
  }

  public produceAction(
    stage: IStage,
    options: ProduceActionOptions
  ): CodePipelineActionFactoryResult {
    stage.addAction(
      new S3DeployAction({
        actionName: this.id,
        input: this.contents,
        bucket: this.bucket,
        runOrder: options.runOrder,
      })
    );
    return { runOrdersConsumed: 1 };
  }
}
