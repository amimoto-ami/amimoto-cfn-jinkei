import {
    ManagedPolicy, Effect, PolicyStatement
} from '@aws-cdk/aws-iam'
import { Stack } from '@aws-cdk/core';

export class IAMPolicyForCloudFront {
    public static create(stack: Stack) {
        const statement = new PolicyStatement({
            effect: Effect.ALLOW,
        })
        statement.addActions(
            "cloudfront:*Invalidation*",
            "cloudfront:*getDistribution*"
        )
        statement.addResources('*')
        const managedPolicy = new ManagedPolicy(
            stack,
            'IAMPolicyForCloudFront',
            {
                // managedPolicyName: 'ManageCloudFrontFromWordPressPolicy',
                description: "To access CloudFront from AMIMOTO WordPress",
                statements: [
                    statement
                ]
            }
        )
        return managedPolicy
    }
}