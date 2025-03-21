{pkgs}:

let
  script = ''
    #!/bin/bash

    # base href has to be passed as an argument
    BASE_HREF=$1
    if [ -z "$BASE_HREF" ]; then
        echo "BASE_HREF is not set"
        exit 1
    fi

    # zip path has to be passed as an argument
    ZIP_PATH=$2
    if [ -z "$ZIP_PATH" ]; then
        echo "ZIP_PATH is not set"
        exit 1
    fi

    # relative path to the widgetbook directory has to be passed as an argument
    WIDGETBOOK_SRC_DIR=$3
    if [ -z "$WIDGETBOOK_SRC_DIR" ]; then
        echo "WIDGETBOOK_SRC_DIR is not set"
        exit 1
    fi

    # output directory has to be passed as an argument
    OUTPUT_DIR=$4
    if [ -z "$OUTPUT_DIR" ]; then
        echo "OUTPUT_DIR is not set"
        exit 1
    fi

    # unzip the zip file
    # mk temp dir to unzip into
    TEMP_DIR=$ZIP_PATH.tmp
    EXTRACT_DIR=$TEMP_DIR/extract
    mkdir -p $EXTRACT_DIR
    ${pkgs.unzip}/bin/unzip $ZIP_PATH -d $EXTRACT_DIR > /dev/null
    
    # get the name of the folder inside the zip file
    WIDGETBOOK_SRC_DIR=$(ls $EXTRACT_DIR)/$WIDGETBOOK_SRC_DIR

    rm $ZIP_PATH

    # run flutter build web in the temp dir
    cd $TEMP_DIR/$WIDGETBOOK_SRC_DIR || exit 1
    echo "Running flutter build web in"
    pwd
    ${pkgs.flutter}/bin/flutter build web --dart-define IS_WITH_ASSETS=false --base-href $BASE_HREF || exit 1

    # copy the build directory to the output directory
    cp -r build/web $OUTPUT_DIR || exit 1

    # remove the temp dir
    rm -rf $TEMP_DIR
  '';
in
pkgs.runCommand "widgetbook_build" {} ''
  mkdir -p $out/bin
  echo '${script}' > $out/bin/widgetbook_build
  chmod +x $out/bin/widgetbook_build
''