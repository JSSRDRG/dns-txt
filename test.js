'use strict'

const test = require('tape')
const txtStr = require('./')()
const txtBin = require('./')({ binary: true })

const obj = {
  String: 'foo',
  number: 42,
  empty: '',
  null: null,
  bool: true,
  buffer: Buffer.from('bar')
}

test('encodingLength', function (t) {
  const len = txtBin.encodingLength(obj)
  t.equal(len, 54)
  t.end()
})

test('encode', function (t) {
  const buf = txtBin.encode(obj)
  const expected = Buffer.from('0a' + '537472696e67' + '3d' + '666f6f' +
                            '09' + '6e756d626572' + '3d' + '3432' +
                            '06' + '656d707479' + '3d' +
                            '09' + '6e756c6c' + '3d' + '6e756c6c' +
                            '04' + '626f6f6c' +
                            '0a' + '627566666572' + '3d' + '626172', 'hex')
  t.deepEqual(buf, expected)
  t.equal(txtBin.encode.bytes, expected.length)
  t.end()
})

test('encode - empty', function (t) {
  const buf = txtBin.encode({})
  const expected = Buffer.from('00', 'hex')
  t.deepEqual(buf, expected)
  t.equal(txtBin.encode.bytes, expected.length)
  t.end()
})

test('encode - undefined', function (t) {
  const buf = txtBin.encode()
  const expected = Buffer.from('00', 'hex')
  t.deepEqual(buf, expected)
  t.equal(txtBin.encode.bytes, expected.length)
  t.end()
})

test('encode - with buffer', function (t) {
  const buf = Buffer.alloc(3)
  buf.fill(255)
  txtBin.encode({}, buf)
  const expected = Buffer.from('00ffff', 'hex')
  t.deepEqual(buf, expected)
  t.equal(txtBin.encode.bytes, 1)
  t.end()
})

test('encode - with buffer and offset', function (t) {
  const buf = Buffer.alloc(3)
  buf.fill(255)
  txtBin.encode({}, buf, 1)
  const expected = Buffer.from('ff00ff', 'hex')
  t.deepEqual(buf, expected)
  t.equal(txtBin.encode.bytes, 1)
  t.end()
})

test('decode', function (t) {
  const encoded = txtBin.encode(obj)
  const result = txtBin.decode(encoded)
  const expected = {
    string: Buffer.from('foo'),
    number: Buffer.from('42'),
    empty: Buffer.alloc(0),
    null: Buffer.from('null'),
    bool: true,
    buffer: Buffer.from('bar')
  }
  t.deepEqual(result, expected)
  t.equal(txtBin.decode.bytes, encoded.length)
  t.end()
})

test('decode - strings', function (t) {
  const encoded = txtStr.encode(obj)
  const result = txtStr.decode(encoded)
  const expected = {
    string: 'foo',
    number: '42',
    empty: '',
    null: 'null',
    bool: true,
    buffer: 'bar'
  }
  t.deepEqual(result, expected)
  t.equal(txtStr.decode.bytes, encoded.length)
  t.end()
})

test('decode - duplicate', function (t) {
  const orig = {
    Foo: 'bar',
    foo: 'ignore this'
  }
  const expected = {
    foo: Buffer.from('bar')
  }
  const encoded = txtBin.encode(orig)
  const result = txtBin.decode(encoded)
  t.deepEqual(result, expected)
  t.equal(txtBin.decode.bytes, encoded.length)
  t.end()
})

test('decode - single zero bype', function (t) {
  const encoded = Buffer.from('00', 'hex')
  const result = txtBin.decode(encoded)
  t.deepEqual(result, {})
  t.equal(txtBin.decode.bytes, encoded.length)
  t.end()
})

test('decode - with offset', function (t) {
  const encoded = Buffer.from('012300', 'hex')
  const result = txtBin.decode(encoded, 2)
  t.deepEqual(result, {})
  t.equal(txtBin.decode.bytes, 1)
  t.end()
})

test('decode - exactly 256 bytes', function (t) {
  const expected = { foo: '' }
  const maxLength = Object.keys(expected).reduce(function (total, key) {
    return total - key.length - 1 // - 1 for the equal sign used to separate the key and the value
  }, 255)

  for (let n = 0; n < maxLength; n++) {
    expected.foo += 'x'
  }

  // the max case:
  let encoded = txtStr.encode(expected)
  t.equal(txtStr.encode.bytes, 256)
  let result = txtStr.decode(encoded)
  t.deepEqual(result, expected)
  t.equal(txtStr.decode.bytes, encoded.length)

  // go beound the max:
  expected.foo += 'x'
  encoded = txtStr.encode(expected)
  t.equal(txtStr.encode.bytes, 257)
  result = txtStr.decode(encoded)
  t.notDeepEqual(result, expected)
  t.ok(txtStr.decode.bytes > encoded.length)

  t.end()
})
