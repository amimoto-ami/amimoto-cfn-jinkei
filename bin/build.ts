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
        console.log(template)
        writeFileSync(`dist/${name}.yaml`, safeDump(template))
        writeFileSync(`dist/${name}.json`, JSON.stringify(template, null, 2))
    })
}

exportTemplates()