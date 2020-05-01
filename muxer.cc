#include <emscripten/bind.h>
#include <cstdint>
#include <string>
#include <vector>

#include "mkvmuxer.hpp"

using namespace emscripten;
using namespace mkvmuxer;

int hello_world(int a, int b) {
  Segment muxer_segment;
  return sizeof(muxer_segment);
}

class CallbackMkvWriter final : public mkvmuxer::IMkvWriter {
 public:
  explicit CallbackMkvWriter(val data_writtern_cb) :
    data_writtern_cb_(data_writtern_cb) {}
  ~CallbackMkvWriter() override {
    Flush();
  };

  int64_t Position() const override { return pos_; }
  int32_t Position(int64_t position) override { return -1; }
  bool Seekable() const override { return false; }
  int32_t Write(const void* buffer, uint32_t length) override {
    const uint8_t *typed_ptr = static_cast<const uint8_t *>(buffer);
    if (length > 100) {
      // Avoid extra copy for big buffers
      Flush();
      data_writtern_cb_(val(typed_memory_view(length, typed_ptr)));
    } else {
      buffer_.insert(buffer_.end(), typed_ptr, typed_ptr + length);
    }
    pos_ += length;
    return 0;
  }
  void ElementStartNotify(uint64_t element_id, int64_t position) override {
    Flush();
  }

 private:
  void Flush() {
    if (buffer_.empty())
      return;
    data_writtern_cb_(val(typed_memory_view(buffer_.size(), buffer_.data())));
    buffer_.clear();
  }

  int64_t pos_ = 0;
  std::vector<uint8_t> buffer_;
  val data_writtern_cb_;
};

class Muxer {
 public:
  Muxer(val data_writtern_cb, int width, int height, bool vp9)
    : writer_(data_writtern_cb), width_(width), height_(height), vp9_(vp9) {
      bool init_result = Init();
      assert(init_result);
  };

  bool Finalize() {
    return !!main_segment_.Finalize();
  }

  bool AddFrame(std::string data, bool key, double pts_us, double duration_us) {
    Frame frame;
    if(!frame.Init(reinterpret_cast<const uint8_t *>(data.data()), data.size()))
      return false;
    frame.set_track_number(1);
    frame.set_timestamp(static_cast<uint64_t>(pts_us * 1000));
    frame.set_is_key(key);
    frame.set_duration(static_cast<uint64_t>(duration_us * 1000));
    return main_segment_.AddGenericFrame(&frame);
  }

 private:
   bool Init() {
    if (!main_segment_.Init(&writer_))
      return false;

    if (!main_segment_.AddVideoTrack(width_, height_, 1 /* track id */))
      return false;

    auto* track = static_cast<VideoTrack *>(main_segment_.GetTrackByNumber(1));
    if (!track)
      return false;

    if (vp9_)
      track->set_codec_id(Tracks::kVp9CodecId);

    main_segment_.set_mode(Segment::Mode::kLive);
    return true;
  }

  bool vp9_;
  int width_;
  int height_;
  Segment main_segment_;
  CallbackMkvWriter writer_;
};

EMSCRIPTEN_BINDINGS(muxer) {
    function("hello_world", &hello_world);
     class_<Muxer>("Muxer")
         .constructor<val, int, int, bool>()
         .function("Finalize", &Muxer::Finalize)
         .function("AddFrame", &Muxer::AddFrame)
        ;
}