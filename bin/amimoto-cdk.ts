#!/usr/bin/env node
import 'source-map-support/register';
import { getSingleInstanceStacks } from '../lib/stacks/single-instance';

getSingleInstanceStacks()