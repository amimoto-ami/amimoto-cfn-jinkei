import { Stack } from "@aws-cdk/core";
import { Vpc, SubnetType } from "@aws-cdk/aws-ec2";


export class VPC {
    public static create(stack: Stack): Vpc {
        const vpc = new Vpc(
            stack,
            'AMIMOTO-VPC',
            {
                natGateways: 0,
                enableDnsHostnames: true,
                enableDnsSupport: true,
                subnetConfiguration:[{
                    name: 'For EC2',
                    subnetType: SubnetType.PUBLIC,
                }, {
                    name: 'For DB',
                    subnetType: SubnetType.ISOLATED,
                }],
            }
        )
        return vpc
    }
}