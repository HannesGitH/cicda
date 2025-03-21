#! /bin/bash

nix build || exit 1

. env.sh

node result