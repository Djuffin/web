source ~/emsdk/emsdk_env.sh

em++ \
  --bind \
  -g \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ASSERTIONS=1 \
  --std=c++14 \
  -I ../libwebm \
  muxer.cc \
  ../libwebm/libwebm.a \
  -o ./muxer.js