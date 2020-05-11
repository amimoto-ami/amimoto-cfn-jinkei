#!/usr/bin/env node
import { safeDump } from 'js-yaml'
import { SynthUtils } from '@aws-cdk/assert'
import { writeFileSync } from 'fs'
import {
    getSingleInstanceStacks
} from '../lib/stacks'

const exportTemplates = async () => {
    const stacks = await getSingleInstanceStacks()
    stacks.forEach(({name, stack}) => {
        const template = SynthUtils.toCloudFormation(stack)
        writeFileSync(`cloudformation/${name}.yaml`, safeDump(template))
        writeFileSync(`cloudformation/${name}.json`, JSON.stringify(template, null, 2))
    })
}

exportTemplates()