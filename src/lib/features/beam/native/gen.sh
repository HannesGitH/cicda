#!/bin/bash

# swagger basic auth creds have to be in environment variables
if [ -z "$SWAGGER_BASIC_SECR" ]; then
    echo "SWAGGER_BASIC_SECR is not set"
    exit 1
fi

if [ -z "$SWAGGER_BASIC_USER" ]; then
    echo "SWAGGER_BASIC_USER is not set"
    exit 1
fi

if [ -z "$SWAGGER_BASIC_PASS" ]; then
    echo "SWAGGER_BASIC_PASS is not set"
    exit 1
fi


# version has to be passed as an argument, if it is not passed, it will be set to 0.0.1
version=$1

spec_url="https://api.dev.blingcard.app/openapi-${SWAGGER_BASIC_SECR}/"
target_lang=dart

dist_dir=.dist/beam
template_dir=beam_template

# if version is not passed, set it to 0.0.1
if [ -z "$version" ]; then
    version=0.0.1
fi

# re-create dist_dir
rm -rf $dist_dir
mkdir -p $dist_dir

# copy template_dir to dist_dir
cp -r $template_dir/ $dist_dir

# replace version in readme.md
sed -i '' "s/{{VERSION}}/$version/" "$dist_dir/readme.md"

# replace version in pubspec.yaml
sed -i '' "s/{{VERSION}}/$version/" "$dist_dir/pubspec.yaml"

# run the workhorse of the generation
./gen/openapi_parser -u $spec_url -o $dist_dir/lib/gen -d $target_lang

