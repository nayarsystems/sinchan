const sinchan = require("../src/index.js");

test("just created channel is not closed", () => {
  const ch = new sinchan.Channel();
  expect(ch.isClosed()).toEqual(false);
});

test("isClosed returns true on closed channel", () => {
  const ch = new sinchan.Channel();
  ch.close();
  expect(ch.isClosed()).toEqual(true);
});

test("writing on closed channel throws exception", async () => {
  const ch = new sinchan.Channel();
  ch.close();

  try {
    await ch.write("hola");
    throw new Error("should have thrown exception");
  } catch (e) {
    expect(e).toEqual(new sinchan.ClosedChannelError());
  }
});

test("read from unbuffered closed channel should return null", async () => {
  const ch = new sinchan.Channel();

  ch.close();

  expect(await ch.read()).toEqual(null);
});

test("writing on unbuffered channel blocks", done => {
  const ch = new sinchan.Channel();

  return Promise.race([
    new Promise(async (resolve, reject) => {
      await ch.write("hola");
      reject(new Error("write must block"));
    }),
    new Promise(() => {
      setTimeout(done, 1);
    })
  ]);
});

test("read from unbuffered channel blocks", done => {
  const ch = new sinchan.Channel();

  return Promise.race([
    new Promise(async (resolve, reject) => {
      await ch.read();
      reject(new Error("read must block"));
    }),
    new Promise(() => {
      setTimeout(done, 1);
    })
  ]);
});

test("read after write on unbuffered channel", async () => {
  const ch = new sinchan.Channel();

  ch.write("test1");

  expect(await ch.read()).toEqual("test1");
});

test("on unbuffered channel second read after write must block", async done => {
  const ch = new sinchan.Channel();

  ch.write("test1");

  await ch.read();

  return Promise.race([
    new Promise(async (resolve, reject) => {
      await ch.read();
      reject(new Error("read must block"));
    }),
    new Promise(() => {
      setTimeout(done, 1);
    })
  ]);
});

test("read before write on unbuffered channel", async done => {
  const ch = new sinchan.Channel();

  setTimeout(async () => {
    expect(await ch.read()).toEqual("test2");
    done();
  }, 0);

  setTimeout(async () => {
    ch.write("test2");
  }, 1);
});

test("reads after writes on buffered channel (without filling it)", async () => {
  const ch = new sinchan.Channel(2);

  await ch.write("hello");
  await ch.write("world");

  expect(await ch.read()).toEqual("hello");
  expect(await ch.read()).toEqual("world");
});

test("reads after writes on buffered channel (filling it)", async () => {
  const ch = new sinchan.Channel(2);

  ch.write("hello");
  ch.write("world");
  ch.write("!");

  expect(await ch.read()).toEqual("hello");
  expect(await ch.read()).toEqual("world");
  expect(await ch.read()).toEqual("!");
});

test("reads before writes on buffered channel", async done => {
  const ch = new sinchan.Channel(2);

  setTimeout(async () => {
    expect(await ch.read()).toEqual("test1");
  }, 0);

  setTimeout(async () => {
    expect(await ch.read()).toEqual("test2");
  }, 1);

  setTimeout(async () => {
    expect(await ch.read()).toEqual("test3");
    done();
  }, 2);

  setTimeout(async () => {
    await ch.write("test1");
  }, 3);

  setTimeout(async () => {
    await ch.write("test2");
  }, 4);

  setTimeout(async () => {
    await ch.write("test3");
  }, 5);
});

test("writes after filling buffered channel should block", async done => {
  const ch = new sinchan.Channel(2);

  await ch.write("hello");
  await ch.write("world");

  return Promise.race([
    new Promise(async (resolve, reject) => {
      await ch.write("!");
      reject(new Error("write must block"));
    }),
    new Promise(() => {
      setTimeout(done, 1);
    })
  ]);
});

test("just created channel has 0 queued elements", async () => {
  const ch = new sinchan.Channel(3);

  expect(ch.numQueued()).toEqual(0);
});

test("return number of queued elements on channel", async () => {
  const ch = new sinchan.Channel(3);

  await ch.write("hello");
  await ch.write("world");

  expect(ch.numQueued()).toEqual(2);
});

test("return number of queued elements on channel", async () => {
  const ch = new sinchan.Channel(3);

  await ch.write("hello");
  await ch.write("world");

  expect(ch.numQueued()).toEqual(2);
});

test("closed channel returns queued elements", async () => {
  const ch = new sinchan.Channel(3);

  await ch.write("how");
  await ch.write("are");
  await ch.write("you");

  ch.close();

  expect(await ch.read()).toEqual("how");
  expect(await ch.read()).toEqual("are");
  expect(await ch.read()).toEqual("you");
});

test("closed buffered channel returns null when there are no more queued elements", async () => {
  const ch = new sinchan.Channel(3);

  await ch.write("how");
  await ch.write("are");

  ch.close();

  expect(await ch.read()).toEqual("how");
  expect(await ch.read()).toEqual("are");
  expect(await ch.read()).toEqual(null);
});

test("excess writes on buffered channel cannot be read after closing it", async () => {
  const ch = new sinchan.Channel(2);

  ch.write("how");
  ch.write("are");
  ch.write("you");

  ch.close();

  expect(await ch.read()).toEqual("how");
  expect(await ch.read()).toEqual("are");
  expect(await ch.read()).toEqual(null);
});

test("numQueued must be <= maxBuffered", async () => {
  const ch = new sinchan.Channel(2);

  ch.write("how");
  ch.write("are");
  ch.write("you");

  expect(ch.numQueued()).toEqual(2);
});
