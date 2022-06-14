import { RemovalPolicy } from "@aws-cdk/core";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";
import Config from "../config";
import WebsiteDistribution from "../resources/cloudfront";

const DEFAULT_OBJECT = "index.html";

interface FrontendWebsiteStackProps extends StackProps {
  assets?: any;
}

export class FrontendWebsiteStack extends Stack {
  public bucket: Bucket;
  public frontend: Bucket;
  public distro: WebsiteDistribution;

  constructor(scope: Construct, id: string, props?: FrontendWebsiteStackProps) {
    super(scope, id, props);

    const zone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: Config.zone,
    });

    this.bucket = new Bucket(this, "FrontendDeploymentBucket", {
      bucketName: (Config.domain as string).replace(/\./g, "-"),
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: DEFAULT_OBJECT,
      websiteErrorDocument: DEFAULT_OBJECT,
      autoDeleteObjects: true,
    });
    this.bucket.grantPublicAccess();

    if (process.env.CDK_LOCAL_BUILD) {
      new BucketDeployment(this, "FrontendDeployWebsite", {
        sources: [
          Source.asset(path.join(__dirname, process.env.CDK_LOCAL_BUILD)),
        ],
        destinationBucket: this.bucket,
      });
    }

    const cert = new DnsValidatedCertificate(this, "FrontendDeploymentCert", {
      domainName: Config.domain,
      hostedZone: zone,
      region: "us-east-1",
      subjectAlternativeNames: [`*.${Config.domain}`],
    });

    this.distro = new WebsiteDistribution(
      this,
      "FrontendDeploymentDistro",
      Config.domain,
      cert,
      "/",
      this.bucket
    );

    const record = new ARecord(this, "FrontendAliasRecord", {
      zone,
      recordName: Config.domain,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(this.distro.cloudfront)
      ),
    });
  }

  public getBucketArn(): CfnOutput {
    return new CfnOutput(this, "S3BucketName", {
      exportName: `FrontendStackS3BucketName`,
      value: this.bucket.bucketName,
    });
  }
}
