#! /bin/sh

for f in *.svg; do
    svgcleaner --coordinates-precision=4 \
               --properties-precision=4 \
               --transforms-precision=4 \
               --paths-coordinates-precision=4 \
               --remove-declarations=no \
               --remove-nonsvg-attributes=no \
               --indent=2 $f $f
done
