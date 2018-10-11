function ClosedChannelError() {}

/**
 * Channel functions like a Go channel.
 */
class Channel {
  /**
   * Create a channel.
   * @param {number} maxBuffered - Number of buffered elements on channel (0 or undefined creates an unbuffered channel)
   */
  constructor(maxBuffered) {
    this.closed = false;
    this.reads = [];
    this.writes = [];
    this.maxBuffered = maxBuffered > 0 ? maxBuffered : 0;
  }

  /**
   * Returns if the channel is closed
   * @return {boolean} - true if the channel is closed
   */
  isClosed() {
    return this.closed;
  }

  /**
   * Closes the channel
   */
  close() {
    this.closed = true;

    // Reject writes that are excess over maxBuffered
    const queued = this.writes.length;
    for (let i = this.maxBuffered; i < queued; i++) {
      const write = this.writes.splice(this.maxBuffered, 1)[0];
      write.rej();
    }
  }

  /**
   * Writes a value on the channel. Returns a promise that is resolved when the written value has been read
   * @param {any} value - Value to write to channel
   */
  async write(value) {
    if (this.closed) {
      throw new ClosedChannelError();
    }

    if (this.reads.length > 0) {
      const read = this.reads.splice(0, 1)[0];
      read.res(value);
      return null;
    }

    if (this.writes.length >= this.maxBuffered) {
      return new Promise((resolve, reject) => {
        this.writes.push({
          val: value,
          res: resolve,
          rej: reject
        });
      });
    }

    this.writes.push({
      val: value,
      res: () => {},
      rej: () => {}
    });

    return null;
  }

  /**
   * Reads value from channel. Returns promise that resolves when value is available
   * @return {any} - Value read
   */
  async read() {
    if (this.writes.length > 0) {
      const write = this.writes.splice(0, 1)[0];
      write.res();
      return write.val;
    }

    if (this.closed) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.reads.push({
        res: resolve,
        rej: reject
      });
    });
  }

  /**
   * Returns number of elements queued on channel
   * @return {number} - Number of elements queued on channel
   */
  numQueued() {
    if (this.writes.length > this.maxBuffered) return this.maxBuffered;
    return this.writes.length;
  }
}

exports.Channel = Channel;
exports.ClosedChannelError = ClosedChannelError;
