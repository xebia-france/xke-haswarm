#!/bin/sh
set -x

CWD=$(cd $(dirname $0);pwd)
MAKE=$0
IMAGE=xebiafrance/trombi

usage(){
cat<<-EOUSAGE
make.sh [Action]
Actions:
  builder       create builder image
  clean         clean up
  build         create binary using builder image
  image         create final image
  push          push the final image
  run           run the final image
  build-chain   builder,build,image

EOUSAGE
}

case $1 in
  builder)
    (cd $CWD; docker build -f $CWD/Dockerfile.build -t $IMAGE-builder . )
  ;;
  clean)
    rm -rf $CWD/dist
  ;;
  build)
    $MAKE clean
    docker run --rm -v $CWD/dist:/src/dist $IMAGE-builder
  ;;
  image)
    cp $CWD/Dockerfile $CWD/dist/
    docker build -t $IMAGE $CWD/dist
  ;;
  push)
    docker push $IMAGE
  ;;
  run)
    docker run $IMAGE
  ;;
  build-chain)
    $MAKE builder && $MAKE build && $MAKE image
  ;;
  *)
    usage
  ;;
esac