import { Stack, SecretValue, RemovalPolicy, Fn } from "@aws-cdk/core";
import { StackParameters } from "../../parameters";
import { DatabaseInstance, DatabaseInstanceEngine } from "@aws-cdk/aws-rds";
import { InstanceClass, InstanceSize, InstanceType, SubnetType } from "@aws-cdk/aws-ec2";
import { RDSDependedResources } from "./model";
import { getStackName } from "../helper";


export class MariaDB {
    public static create(stack: Stack, params: StackParameters, {
        vpc, sg:　sgForDB
    }: RDSDependedResources): DatabaseInstance {
        const db = new DatabaseInstance(
            stack,
            'Database',
            {
                removalPolicy: RemovalPolicy.DESTROY,
                deletionProtection: false,
                multiAz: params.isMultiAZDatabase.valueAsString as unknown as boolean,
                engine: DatabaseInstanceEngine.MARIADB,
                instanceClass: params.dbInstanceClass.valueAsString as unknown as InstanceType,//InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL),
                masterUsername: params.dbUsername.valueAsString,
                masterUserPassword: SecretValue.plainText(params.dbPassword.valueAsString),
                vpc,
                vpcPlacement: vpc.selectSubnets({
                    subnetType: SubnetType.ISOLATED
                }),
                instanceIdentifier: [getStackName(stack), 'Database'].join('-'),
                databaseName: 'wordpress',
                securityGroups: [
                    sgForDB
                ],
            }
          )
          db.node.addDependency(vpc)
          return db
    }
}