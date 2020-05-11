import {Stack, CfnCondition, Fn} from '@aws-cdk/core';
import { StackParameters } from '../parameters';

export enum CFNConditionNames {
    HasCDNCookieWhiteLists = "HasCDNCookieWhiteLists",
    HasACMCertificationARN = "HasACMCertificationARN",
    IsMultiAZDatabase = 'IsMultiAZDatabase'
}

export const createCFNConditions = (stack: Stack, cfnParameter: StackParameters) => {
    // Cookie white listsパラメタの有無
    new CfnCondition(
        stack,
        CFNConditionNames.HasCDNCookieWhiteLists,
        {
            expression: Fn.conditionNot(
            Fn.conditionEquals(
                Fn.join("", cfnParameter.cdnCookieWhiteLists.valueAsList),
                ""
            )
            )
        }
    )

    // Is the ACM Certification ARN provided
    new CfnCondition(
        stack,
        CFNConditionNames.HasACMCertificationARN,
        {
            expression: Fn.conditionNot(
                Fn.conditionEquals(
                    cfnParameter.certificationARN,
                    ""
                )
            )
        }
    )
    new CfnCondition(
        stack,
        CFNConditionNames.IsMultiAZDatabase,
        {
            expression: Fn.conditionEquals(
                cfnParameter.isMultiAZDatabase,
                "true"
            )
        }
    )
}
