import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { AMIMOTOSingleStack as AmimotoCdkStack } from '../lib/stacks/single-instance';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AmimotoCdkStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
