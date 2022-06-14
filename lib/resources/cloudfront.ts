import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
    CloudFrontWebDistribution,
    OriginProtocolPolicy,
    SecurityPolicyProtocol,
    SSLMethod,
    ViewerCertificate,
} from "aws-cdk-lib/aws-cloudfront";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export default class WebsiteDistribution {
    public cloudfront: CloudFrontWebDistribution;

    constructor(scope: Construct, name: string, domain: string, cert: DnsValidatedCertificate, rootObject: string, bucket: Bucket) {
        const viewer = ViewerCertificate.fromAcmCertificate(cert, {
            aliases: [domain],
            sslMethod: SSLMethod.SNI,
            securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2021,
        });

        this.cloudfront = new CloudFrontWebDistribution(scope, name, {
            viewerCertificate: viewer,
            defaultRootObject: rootObject,
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: bucket.bucketWebsiteDomainName,
                        originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
                    },
                    behaviors: [{ isDefaultBehavior: true }],
                },
            ],
            errorConfigurations: [
                {
                    responsePagePath: "/index.html",
                    responseCode: 404,
                    errorCode: 404,
                },
                {
                    responsePagePath: "/index.html",
                    responseCode: 504,
                    errorCode: 504,
                },
            ],
        });
    }
}
