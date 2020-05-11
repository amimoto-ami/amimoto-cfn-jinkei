import { Stack } from "@aws-cdk/core";
import {
    NetworkLoadBalancer, NetworkTargetGroup, TargetType, InstanceTarget
} from '@aws-cdk/aws-elasticloadbalancingv2'
import { StackParameters } from "../../parameters";
import { Vpc, SubnetType, CfnInstance } from "@aws-cdk/aws-ec2";

/**
 * We have to support SubnetMappindgs in AWS CDK
 * Now we can only create LB as ALB or CLB.
 * @see https://github.com/suzryo/aws/blob/master/CFn/ec2-wordpress/cloudfront-wordpress-al2/sample-5.yaml
 * @see https://dev.classmethod.jp/articles/cloudfront-wordpress-cfn/
 * @see https://github.com/aws/aws-cdk/issues/4319
 * @see https://github.com/aws/aws-cdk/issues/7424
 */
export class LoadBalancer {
    public static create(stack: Stack, params: StackParameters, {
        vpc,
        ec2,
    }: {
        vpc: Vpc;
        ec2: CfnInstance;
    }) {
        const nlb = new NetworkLoadBalancer(
            stack,
            'AMIMOTONLB',
            {
                vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: SubnetType.PUBLIC
                })
            }
        )
        
        
        nlb.addListener('NLBHTTPListner', {
            port: 80
        }).addTargets('NLBHttpTargets', {
            port: 80,
            targets: [new InstanceTarget(ec2.ref)]
        })
        return nlb
    }
}