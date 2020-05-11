import { Stack, CfnOutput, Fn, Aws } from "@aws-cdk/core";
import ec2 = require('@aws-cdk/aws-ec2')
import { SecurityGroup, Vpc, CfnEIP, CfnEIPAssociation } from '@aws-cdk/aws-ec2';

import { StackParameters } from "../../parameters";
import { DatabaseInstance } from "@aws-cdk/aws-rds";
import { Role, CfnInstanceProfile } from "@aws-cdk/aws-iam";
import { StackMapping, MappingNames } from "../../mappings";

export type EC2InstanceParams = {
    securityGroup: SecurityGroup;
    vpc: Vpc;
    dbInstanceEndpointPort: string;
    dbInstanceEndpointAddress: string;
    instanceRole: Role;
}
export default class EC2Resource {
    private readonly stack: Stack
    private readonly params: StackParameters
    constructor(stack: Stack, params: StackParameters) {
        this.stack = stack
        this.params = params
    }
    public create({
        securityGroup,
        vpc,
        dbInstanceEndpointPort,
        dbInstanceEndpointAddress,
        instanceRole
    }: EC2InstanceParams) {
        /**
         * Instance Profile
         */
        const iamInstanceProfile = new CfnInstanceProfile(
            this.stack,
            'InstanceProfile',
            {
                path: '/',
                roles: [instanceRole.roleName]
            }
        )
        /**
         * Instance
         */
        const ec2Instance = new ec2.CfnInstance(this.stack, 'amimotoEC2', {
          imageId: Fn.findInMap(
              MappingNames.MPAmimotoAMIID,
              Aws.REGION,
              'ID'
          ),
          iamInstanceProfile: iamInstanceProfile.ref,
          instanceType: this.params.instanceTypes.valueAsString,
          networkInterfaces:[{
            associatePublicIpAddress: true,
            deviceIndex: '0',
            groupSet: [securityGroup.securityGroupId],
            subnetId: vpc.publicSubnets[0].subnetId
          }],
          keyName: this.params.sshKeyPaierName.valueAsString
        })
        ec2Instance.cfnOptions.creationPolicy = {
            resourceSignal: {
                timeout: "PT30M"
            }
        }
        this.setMetadata(ec2Instance, {
            dbInstanceEndpointPort,
            dbInstanceEndpointAddress,
        })
        new CfnOutput(this.stack, 'InstanceID_LoginId', { value: ec2Instance.ref });
        new CfnOutput(this.stack, 'ServerIPAddress', { value: ec2Instance.attrPublicIp });
        ec2Instance.node.addDependency(vpc)

        /**
         * Userdata
         */
        const userData = ec2.UserData.forLinux()
        userData.addCommands([
            "/opt/aws/bin/cfn-init",
            `--region ${this.stack.region}`,
            `--stack ${this.stack.stackName}`,
            `--resource ${ec2Instance.logicalId}`
        ].join(' '))
        userData.addCommands(userDataScripts)
        // complete
        userData.addCommands([
            "/opt/aws/bin/cfn-signal -e 0",
            ` --stack ${this.stack.stackName}`,
            ` --resource ${ec2Instance.logicalId}`,
            ` --region ${this.stack.region}`,
        ].join(' '))
        ec2Instance.userData = Fn.base64(userData.render())

        
        return ec2Instance
    }

    public setMetadata(ec2: ec2.CfnInstance, {
        dbInstanceEndpointAddress,
        dbInstanceEndpointPort
    }: {
        dbInstanceEndpointPort: string;
        dbInstanceEndpointAddress: string;
    }): void {
        ec2.addOverride('Metadata', {
            'AWS::CloudFormation::Init': {
                configSets: {
                    provision: [
                        "do:provision"
                    ],
                    default: [
                        "default"
                    ]
                },
                "do:provision": {
                    commands: {
                        "do:provision": {
                            command: "/opt/local/provision"
                        }
                    }
                },
                default: {
                    files: {
                        '/opt/aws/cloud_formation.json': {
                            content: JSON.stringify({
                                rds: {
                                    database: "wordpress",
                                    username: this.params.dbUsername.valueAsString,
                                    password: this.params.dbPassword.valueAsString,
                                    port: dbInstanceEndpointPort,
                                    endpoint: dbInstanceEndpointAddress
                                }
                            }),
                            mode: "00644",
                            owner: "root",
                            group: "root",
                        },
                        "/etc/cfn/cfn-hup.conf": {
                            content: [
                                "[main]",
                                "stack={{stackArn}}",
                                "region={{region}}"
                            ].join(''),
                            context: {
                                stackArn: this.stack.stackId,
                                region: this.stack.region,
                            },
                            mode: "000400",
                            owner: "root",
                            group: "root",
                        },
                        "/etc/cfn/hooks.d/cfn-auto-reloader.conf": {
                            content: `[cfn-auto-reloader-hook]
triggers=post.update
path=Resources.{{resources}}.Metadata.AWS::CloudFormation::Init
action=/opt/aws/bin/cfn-init -s {{stackArn}} -r {{resources}} --region {{region}}  --configsets provision
runas=root`,
                            context: {
                                stackArn: this.stack.stackId,
                                region: this.stack.region,
                                resources: ec2.logicalId
                            }
                        }
                    }
                }
            }
        })
    }
}
const userDataScripts = `
/opt/aws/bin/cfn-hup

## AMIMOTO CFN Flags
tmp_json="mktemp"
amimoto_json='/opt/local/amimoto.json'
json='{\"wordpress\":{\"jinkei_cf\":\"true\"}}'
[ ! -e /opt/local ] && /bin/mkdir -p /opt/local
if [ -f $amimoto_json ]; then
    hash jq || sudo /usr/bin/yum install -y jq
    /usr/bin/jq -s '.[0] * .[1]' $amimoto_json <(echo $json) > $tmp_json
else
    echo $json > $tmp_json
fi
[ -f $tmp_json ] && sudo /bin/mv -f $tmp_json $amimoto_json

## Wait for WP Setup
until find /var/www/vhosts -name wp-config.php  ; do sleep 5 ; done
`