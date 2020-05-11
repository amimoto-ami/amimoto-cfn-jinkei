import { Stack, SecretValue, CfnOutput, RemovalPolicy } from "@aws-cdk/core";
import { StackParameters } from "../../parameters";
import { RDSDependedResources } from "./model";
import { DatabaseCluster, DatabaseClusterEngine, ClusterParameterGroup } from "@aws-cdk/aws-rds";
import { InstanceType, InstanceClass, InstanceSize } from "@aws-cdk/aws-ec2";

export class AuroraMySQLDB {
    public static create(stack: Stack, params: StackParameters, resources: RDSDependedResources) {
        const cluster = new DatabaseCluster(
            stack,
            'DatabaseCluster',
            {
                engine: DatabaseClusterEngine.AURORA_MYSQL,
                removalPolicy: RemovalPolicy.DESTROY,
                engineVersion: '5.7.12',
                port: 3306,
                defaultDatabaseName: 'wordpress',
                masterUser: {
                    username: params.dbUsername.valueAsString,
                    password: SecretValue.plainText(
                        params.dbPassword.valueAsString
                    ),
                },
                instanceProps: {
                    instanceType: InstanceType.of(
                        InstanceClass.T2,
                        InstanceSize.SMALL
                    ),
                    vpc: resources.vpc,
                    securityGroup: resources.sg
                },
                parameterGroup: ClusterParameterGroup.fromParameterGroupName(
                    stack,
                    'AuroraParameterGroup',
                    'default.aurora-mysql5.7'
                )
            }
        )
        cluster.node.addDependency(resources.vpc)
        return cluster
    }
}