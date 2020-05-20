import {
    RDS
} from 'aws-sdk'
import { DescribeDBEngineVersionsMessage } from 'aws-sdk/clients/rds'

export class RDSEngineVersions {
    private readonly client: RDS
    constructor() {
        this.client = new RDS()
    }
    async list(param: DescribeDBEngineVersionsMessage) {
        return this.client.describeDBEngineVersions(param).promise()
    }
    async listAll(param: DescribeDBEngineVersionsMessage, types: string[] = []): Promise<Array<string>> {
        const {
            Marker,
            DBEngineVersions,
        } = await this.list(param)
        if (!DBEngineVersions) return types
        const newItems = [
            ...types,
            ...DBEngineVersions.map(version => version.EngineVersion)
        ].filter((version: string | undefined): version is string => !!version)
        if (!Marker) return this.parseVersion(newItems)
        param.Marker = Marker
        return this.listAll(param, newItems)
    }
    parseVersion(versions: string[]): string[] {
        return Array.from(new Set(versions))
    }
}

/**
const test = async () => {
    const c = new RDSEngineVersions()
    const result = await c.listAll({
        Engine: 'aurora-mysql',
        DBParameterGroupFamily: 'aurora-mysql5.7'
    })
    console.log(result)
}
test()
 * [
  '5.7.12',
  '5.7.mysql_aurora.2.03.2',
  '5.7.mysql_aurora.2.03.3',
  '5.7.mysql_aurora.2.03.4',
  '5.7.mysql_aurora.2.04.0',
  '5.7.mysql_aurora.2.04.1',
  '5.7.mysql_aurora.2.04.2',
  '5.7.mysql_aurora.2.04.3',
  '5.7.mysql_aurora.2.04.4',
  '5.7.mysql_aurora.2.04.5',
  '5.7.mysql_aurora.2.04.6',
  '5.7.mysql_aurora.2.04.7',
  '5.7.mysql_aurora.2.04.8',
  '5.7.mysql_aurora.2.05.0',
  '5.7.mysql_aurora.2.06.0',
  '5.7.mysql_aurora.2.07.0',
  '5.7.mysql_aurora.2.07.1',
  '5.7.mysql_aurora.2.07.2'
 ]
 */