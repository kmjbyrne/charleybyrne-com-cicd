import { PolicyStatement } from "aws-cdk-lib/aws-iam";

/**
 * A policy statement that supports the introspective IAM permissions for looking up Runtime access.
 * This is required for Route53 Hosted Zone operations such as lookups for zone by name.
 */
export default new PolicyStatement({
    actions: ["sts:AssumeRole"],
    resources: ["*"],
    conditions: {
        StringEquals: {
            "iam:ResourceTag/aws-cdk:bootstrap-role": "lookup",
        },
    },
});
