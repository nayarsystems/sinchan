function ClosedChannelError() {}

/**
 * Channel functions like a Go channel.
 */
class Channel {
  /**
   * Creates a channel.
   * @param {number} maxBuffered - Number of buffered elements on channel (0 or undefined creates an unbuffered channel)
   */
  constructor(maxBuffered) {
    this.closed = false;
    this.reads = [];
    this.writes = [];
    this.data = [];
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
    while (this.writes.length > 0) {
      const write = this.writes.splice(0, 1)[0];
      write.rej(new ClosedChannelError());
    }
  }

  /**
   * Writes a value on the channel. Returns a promise that is resolved when the written value has written to the channel's buffer
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

    if (this.data.length >= this.maxBuffered) {
      return new Promise((resolve, reject) => {
        this.writes.push({
          val: value,
          res: resolve,
          rej: reject
        });
      });
    }

    this.data.push(value);
    return null;
  }

  /**
   * Reads value from channel. Returns promise that resolves when value is available
   * @return {any} - Value read
   */
  async read() {
    if (this.data.length > 0) {
      const value = this.data.splice(0, 1)[0];

      // Insert awaiting write on buffer
      if (this.writes.length > 0) {
        const write = this.writes.splice(0, 1)[0];
        this.data.push(write.val);
        write.res();
      }

      return value;
    }

    if (this.closed) {
      return null;
    }

    if (this.writes.length > 0) {
      const write = this.writes.splice(0, 1)[0];
      write.res();
      return write.val;
    }

    return new Promise((resolve, reject) => {
      this.reads.push({
        res: resolve,
        rej: reject
      });
    });
  }

  /**
   * Returns number of elements buffered on channel
   * @return {number} - Number of elements buffered on channel
   */
  numQueued() {
    return this.data.length;
  }
}

exports.Channel = Channel;
exports.ClosedChannelError = ClosedChannelError;
