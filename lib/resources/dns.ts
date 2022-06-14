import { StackProps } from "aws-cdk-lib";
import { HostedZone, IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class FrontendWebsiteDns extends Construct {
  private zone: IHostedZone;
  constructor(
    scope: Construct,
    name: string,
    domainName: string,
    props?: StackProps
  ) {
    super(scope, name);
    this.zone = HostedZone.fromLookup(this, "HostedZone", { domainName });
  }
}
