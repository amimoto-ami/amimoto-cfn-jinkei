import { Stack, CfnMapping, CfnMappingProps } from "@aws-cdk/core";
import { listImageIds } from "./ami-hvm";

export type StackMapping = {
    amiId: CfnMapping
}

export enum MappingNames {
    MPAmimotoAMIID = 'MPAmimotoAMIID'
}

export const createCFNMappings = async (stack: Stack): Promise<StackMapping> => {
    const idMappdings = await listImageIds('HVM')
    if (!idMappdings) throw new Error('Faild to get image id')
    return {
        amiId: new CfnMapping(
            stack,
            MappingNames.MPAmimotoAMIID,
            {
                mapping: idMappdings
            }
        )
    }
}