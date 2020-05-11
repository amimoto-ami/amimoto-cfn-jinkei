import { Stack } from "@aws-cdk/core";
import { Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { IAMPolicyForCloudFront } from "./CloudFront";

export class EC2InstanceRole {
    public static create(stack: Stack) {
        const role = new Role(
            stack,
            'IAMInstanceRole',
            {
                // roleName: 'AMIMOTOEC2InstanceRole',
                managedPolicies: [
                    IAMPolicyForCloudFront.create(stack)
                ],
               assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
               path: '/'
            }
        )
        return role
    }
}