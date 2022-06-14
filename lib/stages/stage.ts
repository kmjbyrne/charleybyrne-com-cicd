import { CfnOutput, Stage } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { FrontendWebsiteStack } from "../stacks/frontend-stack";
import { S3DeploymentStep } from "../steps/deployment";

export class ApplicationStacks extends Stage {
    public stack: FrontendWebsiteStack;
    constructor(scope: Construct, name: string, props: any) {
        super(scope, name, props);
        this.stack = new FrontendWebsiteStack(this, "FrontendStack", {
            assets: props.assets,
        });
    }

    public getBucket(): Bucket {
        return this.stack.bucket;
    }

    public getBucketArn(): CfnOutput {
        return this.stack.getBucketArn();
    }
}
