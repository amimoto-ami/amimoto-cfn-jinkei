#!/bin/bash
git checkout -b release
ls -a | grep -v -E "^\.$|^\.\.$|^.git$|^cloudformation" | xargs rm -rf
cp ./cloudformation/*.yaml ./
git add ./
git commit -m "create release package"
echo "Please run git tag [vX.X.X] && git push origin vX.X.X to publish the new version"