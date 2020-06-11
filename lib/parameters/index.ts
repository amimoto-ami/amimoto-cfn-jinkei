import { Stack, CfnParameter, CfnParameterProps, RemovalPolicy } from "@aws-cdk/core"
import { PriceClass } from "@aws-cdk/aws-cloudfront"
import { getAMIMOTOInstanceTypes } from "./EC2InstanceTypes"
import { DatabaseEngine } from "../model"
import { listRDSInstanceClasses } from "./RDSInstanceTypes"

type StackParameterName = 
| 'cdnCookieWhiteLists'
| 'cdnPriceClass'
| 'certificationARN'
| 'domain'
| 'instanceTypes'
| 'sshLocationIpv4'
//| 'sshLocationIpv6'
| 'sshKeyPaierName'
| 'dbUsername'
| 'dbPassword'
| 'dbInstanceClass'
| 'isMultiAZDatabase'

export type StackParameters = {
    [key in StackParameterName]: CfnParameter;
}

export enum CFNParameterNames {
    Domain = 'SiteDomain',
    DBUsername = 'DBUsername',
    DBPassword = 'DBPassword',
    DBMultiAz = 'DBMultiAz',
    DBAllocatedStorage = 'DBAllocatedStorage',
    DBInstanceClass = 'DBInstanceClass',
    CDNCookieWhiteLists = 'CDNCookieWhiteLists',
    CDNPriceClass = 'CDNPriceClass',
    CDNCertificationARN = 'CDNCertificationARN',
    EC2InstanceType = 'EC2InstanceType',
    EC2SSHLocationIPv4 = 'EC2SSHLocationIP',
    //EC2SSHLocationIPv6 = 'EC2SSHLocationIPv6',
    EC2KeyPairName = 'EC2KeyPairName',
}

export const createCFNParameters = async (stack: Stack, options: {
    databaseEngine: DatabaseEngine;
}): Promise<StackParameters> => {
    const parameters: Partial<StackParameters> = {}
    /**
     * RDS
     */
    if (options.databaseEngine !== 'no-rds') {
        parameters.dbUsername = new CfnParameter(
            stack,
            CFNParameterNames.DBUsername,
            {
                type: "String",
                description: "Database username",
                default: "admin"
            }
        )
        parameters.dbPassword = new CfnParameter(
            stack,
            CFNParameterNames.DBPassword,
            {
                type: "String",
                description: "Database password",
                noEcho: true,
            }
        )
        parameters.isMultiAZDatabase = new CfnParameter(
            stack,
            CFNParameterNames.DBMultiAz,
            {
                type: "String",
                description:  "Create a Multi-AZ RDS Database Instance",
                allowedValues: [
                    "true",
                    "false"
                ],
                default: "true"
            }
        )
        parameters.dbInstanceClass = new CfnParameter(
            stack,
            CFNParameterNames.DBInstanceClass,
            {
                type: "String",
                description: "Instance type.",
                default: "t3.medium",
                allowedValues: await listRDSInstanceClasses(options.databaseEngine)
            }
        )
    }

    /**
     * CloudFront Cookie white lists
     */
   parameters.cdnCookieWhiteLists = new CfnParameter(
        stack,
        CFNParameterNames.CDNCookieWhiteLists,
        {
            type: "CommaDelimitedList",
            description: "Allowed CloudFront cookie whitelists",
            default: ""
        }
    )
   parameters.cdnPriceClass = new CfnParameter(
        stack,
        CFNParameterNames.CDNPriceClass,
        {
            type: 'String',
            description: 'CDN Price class.',
            allowedValues: [
                PriceClass.PRICE_CLASS_100,
                PriceClass.PRICE_CLASS_200,
                PriceClass.PRICE_CLASS_ALL
            ],
            default:  PriceClass.PRICE_CLASS_ALL
        }
    )
   parameters.certificationARN = new CfnParameter(
        stack,
        CFNParameterNames.CDNCertificationARN,
        {
            type: "String",
            description: "SSL Certification ARN from Amazon Certificate Manager",
            default: "",
        }
    )
   parameters.domain = new CfnParameter(
        stack,
        CFNParameterNames.Domain,
        {
            type: "String",
            description: "The website domain",
            default: "",
        }
    )

    /**
     * EC2 Instance
     */
    parameters.instanceTypes = new CfnParameter(
        stack,
        CFNParameterNames.EC2InstanceType,
        {
            type: "String",
            description: "Instance type.",
            allowedValues: await getAMIMOTOInstanceTypes(),
            default: "t2.small"
        }
    )
    parameters.sshLocationIpv4 = new CfnParameter(
        stack,
        CFNParameterNames.EC2SSHLocationIPv4,
        {
            description: "The IP address range that can be used to SSH to the EC2 instances (IPv4)",
            type: "String",
            minLength: 9,
            maxLength: 18,
            // allowedPattern: "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})",
            constraintDescription: "Must be a valid IP CIDR range of the form x.x.x.x/x.",
            default: "0.0.0.0/0"
        }
    )
    /*
    const sshLocationIpv6 = new CfnParameter(
        stack,
        CFNParameterNames.EC2SSHLocationIPv6,
        {
            description: "The IP address range that can be used to SSH to the EC2 instances (IPv6)",
            type: "String",
            // allowedPattern: "((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$",
            constraintDescription: "Must be a valid IP CIDR range.",
            default: "::/0"
        }
    )
    */
   parameters.sshKeyPaierName = new CfnParameter(
        stack,
        CFNParameterNames.EC2KeyPairName,
        {
            description: "Name of an existing EC2 key pair to enable SSH access to the instances",
            type: "AWS::EC2::KeyPair::KeyName",
            constraintDescription: "Must be the name of an existing EC2 KeyPair.",
            minLength: 1,
            default: "amimoto-dev"
        }
    )

    // Interface
    createStackInterface(stack)
    return parameters as Required<StackParameters>
}

export const createStackInterface = (stack: Stack):void => {
    stack.templateOptions.metadata = {
        "AWS::CloudFormation::Interface": {
            ParameterGroups: [{
                Label: {
                    default: "Databse COnfiguration"
                },
                Parameters: [
                    CFNParameterNames.DBInstanceClass,
                    CFNParameterNames.DBUsername,
                    CFNParameterNames.DBPassword,
                    CFNParameterNames.DBMultiAz,
                ]
            }, {
                Label: {
                    default: "CDN Configuration"
                },
                Parameters: [
                    CFNParameterNames.CDNCookieWhiteLists,
                    CFNParameterNames.CDNPriceClass,
                    CFNParameterNames.CDNCertificationARN,
                    CFNParameterNames.Domain,
                ]
            }, {
                Label: {
                    default: "EC2 Configuration"
                },
                Parameters: [
                    CFNParameterNames.EC2InstanceType,
                    CFNParameterNames.EC2SSHLocationIPv4,
                    //CFNParameterNames.EC2SSHLocationIPv6,
                    CFNParameterNames.EC2KeyPairName,
                ]
            }]
        }
    }
}