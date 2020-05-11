import * as cdk from '@aws-cdk/core';
import CloudFrontResource from '../resources/CloudFront';
import { createCFNParameters, StackParameters } from '../parameters';
import EC2Resource, { EC2InstanceParams } from '../resources/EC2/Instance';
import { Construct, App, Stack } from '@aws-cdk/core';
import { createCFNConditions } from '../conditions';
import { VPC } from '../resources/VPC/Vpc';
import { SGForInstance, SGForDB, SGForLB } from '../resources/VPC/SecurityGroups';
import { MariaDB } from '../resources/RDS/MariaDB';
import { EC2InstanceRole } from '../resources/IAM/InstanceRole';
import { AuroraMySQLDB } from '../resources/RDS/AuroraMySQL';
import { ALB } from '../resources/EC2/ApplicationLoadBalancer';
import { DatabaseEngine } from '../model';
import { createCFNMappings } from '../mappings';

interface StackProps extends cdk.StackProps {
  databaseType: DatabaseEngine;
}

export class AMIMOTOSingleStack extends cdk.Stack {
  private readonly props?: StackProps
  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.props = props;
  }
  public async create() {
    const { props } = this
    const databaseType = props?.databaseType || 'mariadb'
    // Parameters
    let params: StackParameters
    return createCFNParameters(this, {
      databaseEngine: databaseType
    }).then(param => {
      params = param
      return createCFNMappings(this)
    }).then(() => {
      createCFNConditions(this, params)
  
      // Resources
      const resources: Construct[] = []
      /**
       * VPC
       */
      const vpc = VPC.create(this)
      resources.push(vpc)

      /**
       * Security Group
       */
      const sgForInstance = SGForInstance.create(this, params, {
        vpc
      })
      resources.push(sgForInstance)
      const sgForDB = SGForDB.create(this, params, {
        vpc, sgForInstance
      })
      resources.push(sgForDB)
      const sgForLB = SGForLB.create(this, params, {
        vpc
      })
      resources.push(sgForLB)

      // IAM Instance Role
      const instanceRole = EC2InstanceRole.create(this)
      resources.push(instanceRole)

      // RDS
      const ec2InstanceProps: EC2InstanceParams = {
        vpc,
        securityGroup: sgForInstance,
        dbInstanceEndpointAddress: 'localhost',
        dbInstanceEndpointPort: '3306',
        instanceRole,
      }
      if (databaseType === 'aurora-mysql') {
        const dbCluster = AuroraMySQLDB.create(this, params, {
          vpc,
          sg: sgForDB
        })
        resources.push(dbCluster)
        ec2InstanceProps.dbInstanceEndpointAddress = dbCluster.clusterEndpoint.hostname,
        ec2InstanceProps.dbInstanceEndpointPort = dbCluster.clusterEndpoint.port as any as string
      } else if (databaseType === 'mariadb') {
        const db = MariaDB.create(this, params, {
          vpc,
          sg: sgForDB,
        })
        resources.push(db)
        ec2InstanceProps.dbInstanceEndpointAddress = db.dbInstanceEndpointAddress
        ec2InstanceProps.dbInstanceEndpointPort = db.dbInstanceEndpointPort
      }
      
      // EC2
      const ec2 = new EC2Resource(this, params)
      const ec2Instance = ec2.create(ec2InstanceProps)
      resources.push(ec2Instance)

      // LB
      const lb = ALB.create(this, params, {
        vpc,
        ec2: ec2Instance,
        sg: sgForLB
      })
  
      // CloudFront
      const cdn = CloudFrontResource.create(this, params, {
        //ec2DNSName: ec2Instance.attrPublicDnsName
        ec2DNSName: lb.loadBalancerDnsName
      })
      resources.push(cdn)
      return this
    })
  }
}

export type AMIMOTOCfnStack = {
  app: App;
  name: string;
  stack: Stack;
}
export type AMIMOTOCfnStacks = Array<AMIMOTOCfnStack>
const createApplication = async (app: App, {name, props}: {name: string, props: StackProps}): Promise<AMIMOTOCfnStack> => {
  const stackClass = new AMIMOTOSingleStack(app, name, props)
  const stack = await stackClass.create()
  return {
    stack,
    app,
    name
  }
}

export const getSingleInstanceStacks = async () => {
  const stackConfigs: Array<{
    name: string;
    props: StackProps;
  }> = [{
     name: 'JINKEISingle',
     props: {
       databaseType: 'no-rds'
     }
   }, {
    name: 'JINKEISingleMaria',
    props: {
      databaseType: 'mariadb'
    }
  }, {
    name: 'JINKEISingleAurora',
    props: {
      databaseType: 'aurora-mysql'
    }
  }]
  const app = new App()
  const stacks: AMIMOTOCfnStacks = await Promise.all(stackConfigs.map(async (conf) => {
    return createApplication(app, conf)
  }))


  stacks.forEach(({stack}) => {
      cdk.Tag.add(stack, 'Generator', 'JIN-KEI powered by AMIMOTO')
  })
  return stacks
}