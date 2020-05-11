import { Stack, CfnOutput, Duration } from "@aws-cdk/core";
import { StackParameters } from "../../parameters";
import { ApplicationLoadBalancer, InstanceTarget, Protocol, ApplicationProtocol } from "@aws-cdk/aws-elasticloadbalancingv2";
import { Vpc, SubnetType, CfnInstance, SecurityGroup } from "@aws-cdk/aws-ec2";

export class ALB {
    public static create(stack: Stack, params: StackParameters, {
        vpc,
        ec2,
        sg,
    }: {
        vpc: Vpc;
        ec2: CfnInstance;
        sg: SecurityGroup,
    }) {
        const lb = new ApplicationLoadBalancer(
            stack,
            'ALBForWP',
            {
                vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: SubnetType.PUBLIC
                }),
                securityGroup: sg,
                internetFacing: true,
            }
        )
        lb.addListener('HTTPLisner', {
            port: 80
        }).addTargets('HTTPTarget', {
            port: 80,
            targets: [new InstanceTarget(ec2.ref)],
            healthCheck: {
                path: '/wp-login.php',
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5)
            },
            protocol: ApplicationProtocol.HTTP
        })
        return lb
    }
}