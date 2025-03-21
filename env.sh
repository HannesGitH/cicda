# A more reliable approach to source .env file
set -a # automatically export all variables
source .env
set +a # disable auto-export