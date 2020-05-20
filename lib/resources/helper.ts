import { Stack, ScopedAws } from "@aws-cdk/core";

/**
 * Get `Ref: 'AWS::StackName'` props
 * @param stack 
 */
export const getStackName = (stack: Stack): string => {
    return new ScopedAws(stack).stackName
}