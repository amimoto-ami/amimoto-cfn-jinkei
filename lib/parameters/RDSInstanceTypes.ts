import {
    RDS
} from 'aws-sdk'
import { DescribeOrderableDBInstanceOptionsMessage } from 'aws-sdk/clients/rds'
import { DatabaseEngine } from '../model'

class RDSInstanceTypes {
    private readonly client: RDS
    constructor() {
        this.client = new RDS()
    }
    public async list(params: DescribeOrderableDBInstanceOptionsMessage) {
        return this.client.describeOrderableDBInstanceOptions({
            ...params
        }).promise()
    }
    public async listAll(params: DescribeOrderableDBInstanceOptionsMessage, types: string[] = []): Promise<string[]> {
        const {
            Marker,
            OrderableDBInstanceOptions,
        } = await this.list(params)
        if (!OrderableDBInstanceOptions) return Array.from(new Set(types))
        const updatedLists = [
            ...types,
            ...OrderableDBInstanceOptions.map(option => option.DBInstanceClass)
        ].filter((type: string | undefined): type is string => !!type)
        if (!Marker) return Array.from(new Set(updatedLists.sort())).map(type => type.replace(/^db./, ''))
        params.Marker = Marker
        return this.listAll(params, updatedLists)
    }
}

export const listRDSInstanceClasses = async (engine: DatabaseEngine) => {
    const c = new RDSInstanceTypes()
    const result = await c.listAll({
        Engine: engine,
    })
    console.log({engine, result})
    return result
}

/**
 * listRDSInstanceClasses('aurora-mysql')
 * [
  'db.r3.2xlarge',  'db.r3.4xlarge',
  'db.r3.8xlarge',  'db.r3.large',
  'db.r3.xlarge',   'db.r4.16xlarge',
  'db.r4.2xlarge',  'db.r4.4xlarge',
  'db.r4.8xlarge',  'db.r4.large',
  'db.r4.xlarge',   'db.r5.12xlarge',
  'db.r5.16xlarge', 'db.r5.24xlarge',
  'db.r5.2xlarge',  'db.r5.4xlarge',
  'db.r5.8xlarge',  'db.r5.large',
  'db.r5.xlarge',   'db.t2.medium',
  'db.t2.small',    'db.t3.medium',
  'db.t3.small'
]
 */