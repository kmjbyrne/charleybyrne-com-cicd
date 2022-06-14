import { StackProps } from "aws-cdk-lib";
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

// Important due to CloudFront + ACM being fixed to us-east-1
const FIXED_ACM_REGION = "us-east-1";

export class FrontendWebsiteCertificates extends Construct {
    private zone: IHostedZone;
    constructor(scope: Construct, name: string, domainName: string, zone: IHostedZone, props?: StackProps) {
        super(scope, name);
        const cert = new DnsValidatedCertificate(this, "FrontendDeploymentCert", {
            domainName,
            hostedZone: zone,
            region: FIXED_ACM_REGION,
            subjectAlternativeNames: [`*.${domainName}`],
        });
    }
}
