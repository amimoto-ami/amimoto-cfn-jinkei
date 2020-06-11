import { EC2 } from "aws-sdk";
import { DescribeImagesRequest, Image } from "aws-sdk/clients/ec2";
import * as moment from 'moment'



type AMIType = 'HVM' | 'HVM_AS'
const AMIIDProductIdMappding: {
    [type in AMIType]: string;
} = {
    HVM: 'ckybftal7kp4scjx8utj10878',
    HVM_AS: '8j9xote2vjhx4dqge535ji3l'
}
type ImageIdListItem = {
    ID: string
}
type ImageIdLists = {
    [region: string]: ImageIdListItem
}

class AMIIDFinder {
    private client: EC2
    constructor() {
        this.client = new EC2()
    }
    async list(params: DescribeImagesRequest) {
        return this.client.describeImages(params).promise()
    }
    async getTheLatestImage(name: string, amiType: AMIType, region: string = 'us-east-1') {
        this.client = new EC2({
            region
        })
        const result = await this.list({
            Owners: ['679593333241'],
            Filters: [{
                Name: 'name',
                Values: [
                    name
                ]
            }, {
                Name: 'product-code.type',
                Values: [
                    "marketplace"
                ]
            }]
        })
        const products: {[mpProductId: string]: Image[]} = {}
    
        result.Images?.forEach(item => {
            if (!item.ProductCodes) return
            const mpProductCode = item.ProductCodes.find(code => code.ProductCodeType === 'marketplace')
            if (!mpProductCode || !mpProductCode.ProductCodeId) return
            if (mpProductCode.ProductCodeId !== AMIIDProductIdMappding[amiType]) return
            if (!products[mpProductCode.ProductCodeId]) products[mpProductCode.ProductCodeId] = []
            products[mpProductCode.ProductCodeId].push(item)
        })
        let target: Image | null = null
        Object.entries(products).forEach(([name, images]) => {
            const targets = images.sort((a, b) => {
                const aCreated = moment(a.CreationDate)
                const bCreated = moment(b.CreationDate)
                if (aCreated.unix() > bCreated.unix()) return -1
                if (aCreated.unix() < bCreated.unix()) return 1
                return 0
            })
            target = targets[0]
        })
        return target as Image | null
    }
    async listAllImages(name: string, amiType: AMIType) {
        const {
            Regions
        } = await this.client.describeRegions().promise()
        if (!Regions) return null
        const mapping: ImageIdLists = {}
        await Promise.all(Regions.map(async ({RegionName}) => {
            if (!RegionName) return
            const image = await this.getTheLatestImage(name, amiType, RegionName)
            if (!image || !image.ImageId) return
            console.log({
                region: RegionName,
                amiId: image.ImageId,
                name: image.Name
            })
            mapping[RegionName] = {
                ID: image.ImageId
            }
            return
        }))
        if (Object.keys(mapping).length < 1) return mapping
        const sortedMapping: ImageIdLists = {}
        Object.keys(mapping)
            .sort()
            .forEach(region => {
                sortedMapping[region] = mapping[region]
            })
        return sortedMapping
    }
}

export const listImageIds = async (type: AMIType = 'HVM') => {
    const c = new AMIIDFinder()
    const result = await c.listAllImages('AMIMOTO HVM*', 'HVM')
    console.log(result)
    return result
}