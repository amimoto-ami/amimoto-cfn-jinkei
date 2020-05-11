import {
    EC2
} from 'aws-sdk'
import { DescribeInstanceTypesRequest } from 'aws-sdk/clients/ec2';
import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';

class EC2InstanceTypes {
    private readonly client: EC2 = new EC2()
    
    // 対象のインスタンスクラス
    private targetClasses: InstanceClass[] = []

    // 除外インスタンスタイプ
    private excludedTypes: string[] = []

    /**
     * 対象のインスタンスクラスを追加する
     */
    public putTargetClasses(...classes: InstanceClass[]): this {
        this.targetClasses = Array.from(new Set([
            ...this.targetClasses,
            ...classes
        ]))
        return this
    }
    public putExcludedType(instanceClass: InstanceClass, instanceSize: InstanceSize): this {
        this.excludedTypes = Array.from(new Set([
            ...this.excludedTypes,
            [instanceClass, instanceSize].join('.')
        ]))
        return this
    }

    public putExcludedTypes(...types: {
        instanceSize: InstanceSize;
        instanceClass: InstanceClass
    }[]): this {
        types.map(type => this.putExcludedType(type.instanceClass, type.instanceSize))
        return this
    }

    public async list(param: DescribeInstanceTypesRequest = {}) {
        return this.client.describeInstanceTypes(param).promise()
    }

    public async listAll(types: string[] = [], param: DescribeInstanceTypesRequest = {}): Promise<string[]> {
        const {
            NextToken,
            InstanceTypes,
        } = await this.list(param)
        if (!InstanceTypes) return types;
        const updatedLists = [
            ...types,
            ...InstanceTypes.map(type => type.InstanceType)
        ].filter((type: string | undefined): type is string => !!type)
        if (!NextToken) return this.filterByClass(updatedLists)
        param.NextToken = NextToken
        return this.listAll(updatedLists, param)
    }

    private filterByClass(types: string[]): string[] {
        const uniqnized = Array.from(new Set(types))
        const targetItems = this.targetClasses.length > 0 ? uniqnized.filter(type => {
            const [instanceClass] = type.split('.')
            return this.targetClasses.includes(instanceClass as InstanceClass)
        }): uniqnized
        const excludedItems = this.excludedTypes.length > 0 ? targetItems.filter(item => {
            return !this.excludedTypes.includes(item)
        }) : targetItems
        return excludedItems.sort()
    }
}



export const getAMIMOTOInstanceTypes = async () => {
    const client = new EC2InstanceTypes()
    client.putTargetClasses(
        InstanceClass.T2,
        InstanceClass.T3,
        InstanceClass.M3,
        InstanceClass.M4,
        InstanceClass.M5,
        InstanceClass.C3,
        InstanceClass.C4,
        InstanceClass.C5,
        InstanceClass.R3,
        InstanceClass.R4,
        InstanceClass.R5,
    )
    .putExcludedType(InstanceClass.T2, InstanceSize.NANO)
    .putExcludedType(InstanceClass.T3, InstanceSize.NANO)
    const result = await client.listAll()
    return result
}