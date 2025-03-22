{ pkgs }:
let
  script = ''
    #!/usr/bin/env bash

    # provide the GITHUB_TOKEN via environment variable
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "GITHUB_TOKEN is not set"
        exit 1
    fi

    # the version has to be passed as an argument
    if [ -z "$1" ]; then
        echo "Version is not set"
        exit 1
    fi
    version=$1

    # owner and repo have to be passed as arguments
    if [ -z "$2" ]; then
        echo "Owner is not set"
        exit 1
    fi
    owner=$2
    if [ -z "$3" ]; then
        echo "Repo is not set"
        exit 1
    fi
    repo=$3

    # Set the pipeline directory (defaults to ~/.bling_pipeline)
    PIPELINE_DIR=''\${PIPELINE_DIR:-~/.bling_pipeline}
    mkdir -p "$PIPELINE_DIR"

    dist_dir=.dist/beam

    BEAM_OWNER=$2
    BEAM_REPO=$3
    BEAM_DIR="$PIPELINE_DIR/$BEAM_REPO"

    APP_DIR="$PIPELINE_DIR/$APP_REPO"

    # get absolute path to the dist_dir
    dist_dir=$(realpath $dist_dir)

    # Handle the beam repository
    if [ -d "$BEAM_DIR" ]; then
        echo "Updating existing beam repository..."
        cd "$BEAM_DIR"
        git fetch
        git reset --hard origin/main
    else
        echo "Cloning beam repository for the first time..."
        mkdir -p "$BEAM_DIR"
        git clone https://x-access-token:$GITHUB_TOKEN@github.com/$BEAM_OWNER/$BEAM_REPO.git "$BEAM_DIR"
        cd "$BEAM_DIR"
    fi

    # Configure git
    git config user.name "🪈pipeline"
    git config user.email "pipeline@dev.bling.de"

    # Remove all files except .git
    find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

    # Copy all files from dist_dir
    cp -r $dist_dir/* .

    # Add all files and commit
    git add .
    git commit -m "update to $version"

    # Push changes
    git push https://x-access-token:$GITHUB_TOKEN@github.com/$BEAM_OWNER/$BEAM_REPO.git main

    # get new hash
    hash=$(git rev-parse HEAD)
    echo $hash
  '';
in
pkgs.runCommand "beam_push" {} ''
  mkdir -p $out/bin
  echo '${script}' > $out/bin/beam_push
  chmod +x $out/bin/beam_push
''
