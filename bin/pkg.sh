#!/bin/bash
git checkout -b release
ls -a | grep -v -E "^\.$|^\.\.$|^.git$|^cloudformation" | xargs rm -rf
git add ./
git commit -m "create release package"
echo "Please run npm version [major|minor|patch] and push remote repository by tag"