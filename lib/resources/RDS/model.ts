import { Vpc, SecurityGroup } from "@aws-cdk/aws-ec2";

export type RDSDependedResources = {
    vpc: Vpc;
    sg: SecurityGroup;
}