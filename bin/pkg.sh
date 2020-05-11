#!/bin/bash
ls -a | grep -v -E "^\.$|^\.\.$|^.git$|^cloudformation" 