'use strict'

const equalSign = Buffer.from('=')

module.exports = function (opts) {
  const binary = opts ? opts.binary : false
  const that = {}

  that.encode = function (data, buf, offset) {
    if (!data) data = {}
    if (!offset) offset = 0
    if (!buf) buf = Buffer.alloc(that.encodingLength(data) + offset)

    const oldOffset = offset
    const keys = Object.keys(data)

    if (keys.length === 0) {
      buf[offset] = 0
      offset++
    }

    keys.forEach(function (key) {
      const val = data[key]
      const oldOffset = offset
      offset++

      if (val === true) {
        offset += buf.write(key, offset)
      } else if (Buffer.isBuffer(val)) {
        offset += buf.write(key + '=', offset)
        const len = val.length
        val.copy(buf, offset, 0, len)
        offset += len
      } else {
        offset += buf.write(key + '=' + val, offset)
      }

      buf[oldOffset] = offset - oldOffset - 1
    })

    that.encode.bytes = offset - oldOffset
    return buf
  }

  that.decode = function (buf, offset, len) {
    if (!offset) offset = 0
    if (!Number.isFinite(len)) len = buf.length
    const data = {}
    const oldOffset = offset

    while (offset < len) {
      const b = decodeBlock(buf, offset)
      // const i = bindexOf(b, equalSign)
      const i = b.indexOf(equalSign)
      offset += decodeBlock.bytes

      if (b.length === 0) continue // ignore: most likely a single zero byte
      if (i === -1) data[b.toString().toLowerCase()] = true
      else if (i === 0) continue // ignore: invalid key-length
      else {
        const key = b.slice(0, i).toString().toLowerCase()
        if (key in data) continue // ignore: overwriting not allowed
        data[key] = binary ? b.slice(i + 1) : b.slice(i + 1).toString()
      }
    }

    that.decode.bytes = offset - oldOffset
    return data
  }

  that.encodingLength = function (data) {
    if (!data) return 1 // 1 byte (single empty byte)
    const keys = Object.keys(data)
    if (keys.length === 0) return 1 // 1 byte (single empty byte)
    return keys.reduce(function (total, key) {
      const val = data[key]
      total += Buffer.byteLength(key) + 1 // +1 byte to store field length
      if (Buffer.isBuffer(val)) total += val.length + 1 // +1 byte to fit equal sign
      else if (val !== true) total += Buffer.byteLength(String(val)) + 1 // +1 byte to fit equal sign
      return total
    }, 0)
  }

  return that
}

function decodeBlock (buf, offset) {
  const len = buf[offset]
  const to = offset + 1 + len
  const b = buf.slice(offset + 1, to > buf.length ? buf.length : to)
  decodeBlock.bytes = len + 1
  return b
}
