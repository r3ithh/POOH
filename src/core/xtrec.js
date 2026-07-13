(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./i18n"));
  } else {
    root.PoohXtrecCore = factory(root.PoohI18n);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function(i18n) {
"use strict";

function tr(key, params) {
  return i18n && typeof i18n.t === "function" ? i18n.t(key, params) : String(key || "");
}

// XTREC recognition for class XT:
// T. Eiter, "Exact transversal hypergraphs and application to boolean mu-functions" (1994),
// algorithm form also restated in Eiter/Gottlob survey (JAIR 2005, node2, Algorithm XTREC).

const WEBGPU_WORKGROUP_SIZE = 64;

function asInt(value) {
  return Number.isFinite(value) ? value : parseInt(String(value || 0), 10) || 0;
}

function toBit(value) {
  return asInt(value) > 0 ? 1 : 0;
}

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function naturalLabelCompare(a, b) {
  const aText = String(a || "");
  const bText = String(b || "");

  const aMatch = /^([A-Za-z_]+)(\d+)$/.exec(aText);
  const bMatch = /^([A-Za-z_]+)(\d+)$/.exec(bText);
  if (aMatch && bMatch) {
    const prefixCmp = aMatch[1].localeCompare(bMatch[1], "pl", { sensitivity: "base" });
    if (prefixCmp !== 0) {
      return prefixCmp;
    }
    const aNum = parseInt(aMatch[2], 10);
    const bNum = parseInt(bMatch[2], 10);
    if (aNum !== bNum) {
      return aNum - bNum;
    }
  }

  return aText.localeCompare(bText, "pl", { numeric: true, sensitivity: "base" });
}

function cloneBitset(bits) {
  return new Uint32Array(bits);
}

function bitsetToKey(bits) {
  let out = "";
  for (let i = 0; i < bits.length; i += 1) {
    out += bits[i].toString(36);
    out += ":";
  }
  return out;
}

function bitsetEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function bitsetOrInto(target, source) {
  for (let i = 0; i < target.length; i += 1) {
    target[i] |= source[i];
  }
}

function bitsetAndNot(source, mask) {
  const out = new Uint32Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    out[i] = source[i] & (~mask[i]);
  }
  return out;
}

function bitsetAnd(a, b) {
  const out = new Uint32Array(a.length);
  for (let i = 0; i < a.length; i += 1) {
    out[i] = a[i] & b[i];
  }
  return out;
}

function bitsetIntersects(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    if ((a[i] & b[i]) !== 0) {
      return true;
    }
  }
  return false;
}

function bitsetSubsetOrEqual(subset, superset) {
  if (subset.length !== superset.length) {
    return false;
  }
  for (let i = 0; i < subset.length; i += 1) {
    if ((subset[i] & (~superset[i])) !== 0) {
      return false;
    }
  }
  return true;
}

function bitsetSubsetStrict(subset, superset) {
  return bitsetSubsetOrEqual(subset, superset) && !bitsetEquals(subset, superset);
}

function bitsetHasVertex(bits, vertexIndex) {
  const word = vertexIndex >>> 5;
  const bit = vertexIndex & 31;
  return (bits[word] & (1 << bit)) !== 0;
}

function firstSetBitIndex(bits, vertexCount) {
  for (let word = 0; word < bits.length; word += 1) {
    const value = bits[word] >>> 0;
    if (value === 0) {
      continue;
    }
    for (let bit = 0; bit < 32; bit += 1) {
      if ((value & (1 << bit)) !== 0) {
        const index = (word * 32) + bit;
        if (index < vertexCount) {
          return index;
        }
      }
    }
  }
  return -1;
}

function fillBitsetBytes(bits, vertexCount, out) {
  for (let i = 0; i < vertexCount; i += 1) {
    out[i] = bitsetHasVertex(bits, i) ? 255 : 0;
  }
}

function buildHypergraphFromMatrix(matrix, rowLabels, colLabels) {
  const safeMatrix = Array.isArray(matrix) ? matrix : [];
  const vertexCount = Array.isArray(colLabels)
    ? colLabels.length
    : (safeMatrix[0] && Array.isArray(safeMatrix[0]) ? safeMatrix[0].length : 0);
  const wordCount = Math.max(1, Math.ceil(vertexCount / 32));

  const vertexLabels = Array.from({ length: vertexCount }, (_, index) => {
    if (Array.isArray(colLabels) && colLabels[index] !== undefined) {
      return String(colLabels[index]);
    }
    return `V${index + 1}`;
  });

  const edgeEntries = [];
  for (let rowIndex = 0; rowIndex < safeMatrix.length; rowIndex += 1) {
    const row = Array.isArray(safeMatrix[rowIndex]) ? safeMatrix[rowIndex] : [];
    const bits = new Uint32Array(wordCount);
    for (let colIndex = 0; colIndex < vertexCount; colIndex += 1) {
      if (toBit(row[colIndex]) === 1) {
        bits[colIndex >>> 5] |= (1 << (colIndex & 31));
      }
    }

    const label = Array.isArray(rowLabels) && rowLabels[rowIndex] !== undefined
      ? String(rowLabels[rowIndex])
      : `E${rowIndex + 1}`;
    edgeEntries.push({
      index: rowIndex,
      label,
      bits
    });
  }

  return {
    vertexCount,
    wordCount,
    vertexLabels,
    edgeEntries
  };
}

function computeEssentialVertexMask(edgeEntries, wordCount, operationCounters) {
  const essentialMask = new Uint32Array(wordCount);
  for (let i = 0; i < edgeEntries.length; i += 1) {
    if (operationCounters) {
      operationCounters.essentialUnionOps += 1;
      operationCounters.essentialUnionWordOps += wordCount;
    }
    bitsetOrInto(essentialMask, edgeEntries[i].bits);
  }
  return essentialMask;
}

function essentialVertexIndices(mask, vertexCount) {
  const indices = [];
  for (let i = 0; i < vertexCount; i += 1) {
    if (bitsetHasVertex(mask, i)) {
      indices.push(i);
    }
  }
  return indices;
}

function buildStarMap(edgeEntries, vertexCount, operationCounters) {
  const stars = Array.from({ length: vertexCount }, () => []);
  for (let edgeIndex = 0; edgeIndex < edgeEntries.length; edgeIndex += 1) {
    const bits = edgeEntries[edgeIndex].bits;
    for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
      if (operationCounters) {
        operationCounters.starCellChecks += 1;
      }
      if (bitsetHasVertex(bits, vertexIndex)) {
        stars[vertexIndex].push(edgeIndex);
        if (operationCounters) {
          operationCounters.starAssignments += 1;
        }
      }
    }
  }
  return stars;
}

function minimizeProjectedEdges(projectedEdges, operationCounters) {
  if (projectedEdges.length <= 1) {
    return projectedEdges.map((item) => ({
      bits: cloneBitset(item.bits),
      sourceEdgeIndex: item.sourceEdgeIndex
    }));
  }

  const uniqueMap = new Map();
  for (let i = 0; i < projectedEdges.length; i += 1) {
    const entry = projectedEdges[i];
    const key = bitsetToKey(entry.bits);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        bits: cloneBitset(entry.bits),
        sourceEdgeIndex: entry.sourceEdgeIndex
      });
      if (operationCounters) {
        operationCounters.minUniqueInsertions += 1;
      }
    } else if (operationCounters) {
      operationCounters.minDuplicateEdges += 1;
    }
  }

  const unique = Array.from(uniqueMap.values());
  const removed = new Array(unique.length).fill(false);

  for (let i = 0; i < unique.length; i += 1) {
    if (removed[i]) {
      continue;
    }
    for (let j = i + 1; j < unique.length; j += 1) {
      if (removed[j]) {
        continue;
      }
      const a = unique[i].bits;
      const b = unique[j].bits;
      if (operationCounters) {
        operationCounters.minPairComparisons += 1;
        operationCounters.minSubsetChecks += 1;
      }
      if (bitsetSubsetStrict(a, b)) {
        removed[j] = true;
        continue;
      }
      if (operationCounters) {
        operationCounters.minSubsetChecks += 1;
      }
      if (bitsetSubsetStrict(b, a)) {
        removed[i] = true;
        break;
      }
      if (operationCounters) {
        operationCounters.minEqualsChecks += 1;
      }
      if (bitsetEquals(a, b)) {
        removed[j] = true;
      }
    }
  }

  const result = [];
  for (let i = 0; i < unique.length; i += 1) {
    if (!removed[i]) {
      result.push(unique[i]);
    } else if (operationCounters) {
      operationCounters.minRemovedEdges += 1;
    }
  }
  return result;
}

function computeVeMaskFromProjectedEdges(projectedEdges, wordCount, operationCounters) {
  const veMask = new Uint32Array(wordCount);
  for (let i = 0; i < projectedEdges.length; i += 1) {
    if (operationCounters) {
      operationCounters.veMaskUnionOps += 1;
      operationCounters.veMaskUnionWordOps += wordCount;
    }
    bitsetOrInto(veMask, projectedEdges[i].bits);
  }
  return veMask;
}

function createCpuIntersectionEngine() {
  return {
    kind: "cpu",
    async intersectsMany(maskA, maskBList) {
      return (Array.isArray(maskBList) ? maskBList : []).map((maskB) => bitsetIntersects(maskA, maskB));
    },
    intersects(maskA, maskB) {
      return bitsetIntersects(maskA, maskB);
    }
  };
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error(tr("core.xtrec.shaderCreate"));
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || tr("core.xtrec.noDetails");
    gl.deleteShader(shader);
    throw new Error(tr("core.xtrec.shaderCompile", { details: info }));
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error(tr("core.xtrec.programCreate"));
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || tr("core.xtrec.noDetails");
    gl.deleteProgram(program);
    throw new Error(tr("core.xtrec.programLink", { details: info }));
  }
  return program;
}

class WebGlIntersectionEngine {
  constructor() {
    if (typeof OffscreenCanvas !== "function") {
      throw new Error(tr("core.xtrec.offscreenUnavailable"));
    }
    this.canvas = new OffscreenCanvas(1, 1);
    this.gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false
    });
    if (!this.gl) {
      throw new Error(tr("core.xtrec.contextCreate"));
    }

    this.maxTextureSize = asInt(this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE)) || 0;
    if (this.maxTextureSize <= 0) {
      throw new Error(tr("core.xtrec.textureLimitRead"));
    }

    const vertexShaderSource = `
      attribute vec2 aPos;
      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D uMaskA;
      uniform sampler2D uMaskB;
      uniform float uWidth;
      void main() {
        float u = gl_FragCoord.x / uWidth;
        vec2 uv = vec2(u, 0.5);
        float a = texture2D(uMaskA, uv).r;
        float b = texture2D(uMaskB, uv).r;
        float inter = step(0.5, a) * step(0.5, b);
        gl_FragColor = vec4(inter, 0.0, 0.0, 1.0);
      }
    `;

    this.program = createProgram(this.gl, vertexShaderSource, fragmentShaderSource);
    this.posLoc = this.gl.getAttribLocation(this.program, "aPos");
    this.maskALoc = this.gl.getUniformLocation(this.program, "uMaskA");
    this.maskBLoc = this.gl.getUniformLocation(this.program, "uMaskB");
    this.widthLoc = this.gl.getUniformLocation(this.program, "uWidth");

    this.quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
      ]),
      this.gl.STATIC_DRAW
    );

    this.texA = this.createMaskTexture();
    this.texB = this.createMaskTexture();
    this.outTexture = this.createOutputTexture();
    this.framebuffer = this.gl.createFramebuffer();
    this.currentWidth = 0;
    this.inputA = new Uint8Array(1);
    this.inputB = new Uint8Array(1);
    this.readPixelsBuffer = new Uint8Array(4);
  }

  createMaskTexture() {
    const tex = this.gl.createTexture();
    if (!tex) {
      throw new Error(tr("core.xtrec.textureCreate"));
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    return tex;
  }

  createOutputTexture() {
    const tex = this.gl.createTexture();
    if (!tex) {
      throw new Error(tr("core.xtrec.outputTextureCreate"));
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    return tex;
  }

  ensureWidth(width) {
    if (width > this.maxTextureSize) {
      throw new Error(tr("core.xtrec.vertexTextureLimit"));
    }
    if (width === this.currentWidth) {
      return;
    }

    this.currentWidth = width;
    this.canvas.width = width;
    this.canvas.height = 1;

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.outTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.outTexture, 0);
    const fbStatus = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (fbStatus !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(tr("core.xtrec.framebufferIncomplete"));
    }

    this.inputA = new Uint8Array(width);
    this.inputB = new Uint8Array(width);
    this.readPixelsBuffer = new Uint8Array(width * 4);
  }

  intersects(maskA, maskB, vertexCount) {
    if (vertexCount <= 0) {
      return false;
    }

    this.ensureWidth(vertexCount);
    fillBitsetBytes(maskA, vertexCount, this.inputA);
    fillBitsetBytes(maskB, vertexCount, this.inputB);

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texA);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.LUMINANCE,
      vertexCount,
      1,
      0,
      this.gl.LUMINANCE,
      this.gl.UNSIGNED_BYTE,
      this.inputA
    );

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texB);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.LUMINANCE,
      vertexCount,
      1,
      0,
      this.gl.LUMINANCE,
      this.gl.UNSIGNED_BYTE,
      this.inputB
    );

    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.enableVertexAttribArray(this.posLoc);
    this.gl.vertexAttribPointer(this.posLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texA);
    this.gl.uniform1i(this.maskALoc, 0);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texB);
    this.gl.uniform1i(this.maskBLoc, 1);
    this.gl.uniform1f(this.widthLoc, vertexCount);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, vertexCount, 1);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.readPixels(0, 0, vertexCount, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.readPixelsBuffer);
    for (let i = 0; i < this.readPixelsBuffer.length; i += 4) {
      if (this.readPixelsBuffer[i] > 0) {
        return true;
      }
    }
    return false;
  }

  async intersectsMany(maskA, maskBList, wordCount, vertexCount) {
    const masks = Array.isArray(maskBList) ? maskBList : [];
    const out = [];
    for (let i = 0; i < masks.length; i += 1) {
      out.push(this.intersects(maskA, masks[i], vertexCount));
    }
    return out;
  }
}

class WebGpuIntersectionEngine {
  constructor(device) {
    this.device = device;
    const shaderCode = `
struct Params {
  count: u32,
  words: u32,
  _pad0: u32,
  _pad1: u32,
};

@group(0) @binding(0) var<storage, read> maskA: array<u32>;
@group(0) @binding(1) var<storage, read> masksB: array<u32>;
@group(0) @binding(2) var<storage, read_write> outValues: array<u32>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(${WEBGPU_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let index = gid.x;
  if (index >= params.count) {
    return;
  }

  let base = index * params.words;
  var hit: u32 = 0u;
  for (var word: u32 = 0u; word < params.words; word = word + 1u) {
    if ((maskA[word] & masksB[base + word]) != 0u) {
      hit = 1u;
      break;
    }
  }
  outValues[index] = hit;
}
`;
    const shaderModule = this.device.createShaderModule({ code: shaderCode });
    this.pipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: shaderModule,
        entryPoint: "main"
      }
    });
  }

  static async create() {
    const nav = typeof self !== "undefined" && self.navigator
      ? self.navigator
      : (typeof navigator !== "undefined" ? navigator : null);
    if (!nav || !nav.gpu || typeof nav.gpu.requestAdapter !== "function") {
      throw new Error(tr("core.xtrec.webgpuUnavailable"));
    }
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      throw new Error(tr("core.xtrec.webgpuAdapterMissing"));
    }
    const device = await adapter.requestDevice();
    return new WebGpuIntersectionEngine(device);
  }

  async intersectsMany(maskA, maskBList, wordCount) {
    const masks = Array.isArray(maskBList) ? maskBList : [];
    const count = masks.length;
    const words = Math.max(1, Number(wordCount || (maskA && maskA.length) || 0));
    if (count === 0) {
      return [];
    }

    const cells = count * words;
    if (cells > 35000000) {
      throw new Error(tr("core.xtrec.webgpuBatchTooLarge"));
    }

    const maskAData = new Uint32Array(words);
    if (maskA && typeof maskA.length === "number") {
      maskAData.set(maskA.subarray ? maskA.subarray(0, words) : Array.prototype.slice.call(maskA, 0, words));
    }
    const masksData = new Uint32Array(cells);
    for (let i = 0; i < count; i += 1) {
      const mask = masks[i];
      const offset = i * words;
      if (mask && typeof mask.length === "number") {
        masksData.set(mask.subarray ? mask.subarray(0, words) : Array.prototype.slice.call(mask, 0, words), offset);
      }
    }

    const maskABuffer = this.device.createBuffer({
      size: maskAData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const masksBuffer = this.device.createBuffer({
      size: masksData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const outputBuffer = this.device.createBuffer({
      size: count * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const paramsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const readBuffer = this.device.createBuffer({
      size: count * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    this.device.queue.writeBuffer(maskABuffer, 0, maskAData);
    this.device.queue.writeBuffer(masksBuffer, 0, masksData);
    this.device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([count, words, 0, 0]));

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: maskABuffer } },
        { binding: 1, resource: { buffer: masksBuffer } },
        { binding: 2, resource: { buffer: outputBuffer } },
        { binding: 3, resource: { buffer: paramsBuffer } }
      ]
    });

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(count / WEBGPU_WORKGROUP_SIZE));
    pass.end();
    encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, count * 4);

    this.device.queue.submit([encoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const mapped = readBuffer.getMappedRange();
    const raw = new Uint32Array(mapped.slice(0));
    readBuffer.unmap();

    maskABuffer.destroy();
    masksBuffer.destroy();
    outputBuffer.destroy();
    paramsBuffer.destroy();
    readBuffer.destroy();

    return Array.from(raw, (value) => value !== 0);
  }

  async intersects(maskA, maskB, vertexCount) {
    const values = await this.intersectsMany(maskA, [maskB], maskA ? maskA.length : 1, vertexCount);
    return Boolean(values[0]);
  }
}

async function resolveIntersectionEngine(accelerationMode) {
  const safeMode = String(accelerationMode || "").toLowerCase();
  const requested = safeMode === "webgpu" ? "webgpu" : (safeMode === "webgl" ? "webgl" : "cpu");
  if (requested === "cpu") {
    return {
      requested,
      used: "cpu",
      warning: "",
      engine: createCpuIntersectionEngine()
    };
  }

  if (requested === "webgpu") {
    try {
      const engine = await WebGpuIntersectionEngine.create();
      return {
        requested,
        used: "webgpu",
        warning: "",
        engine
      };
    } catch (error) {
      const webGpuMessage = error instanceof Error ? error.message : tr("core.xtrec.webgpuInitUnknown");
      try {
        const engine = new WebGlIntersectionEngine();
        return {
          requested,
          used: "webgl",
          warning: tr("core.xtrec.webgpuToWebgl", { webgpu: webGpuMessage }),
          engine
        };
      } catch (webGlError) {
        const webGlMessage = webGlError instanceof Error ? webGlError.message : tr("worker.xtrec.webglInitUnknown");
        return {
          requested,
          used: "cpu",
          warning: tr("core.xtrec.webgpuWebglToCpu", { webgpu: webGpuMessage, webgl: webGlMessage }),
          engine: createCpuIntersectionEngine()
        };
      }
    }
  }

  try {
    const engine = new WebGlIntersectionEngine();
    return {
      requested,
      used: "webgl",
      warning: "",
      engine
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : tr("worker.xtrec.webglInitUnknown");
    return {
      requested,
      used: "cpu",
      warning: tr("core.xtrec.webglToCpu", { reason: message }),
      engine: createCpuIntersectionEngine()
    };
  }
}

function buildProjectedEdges(edgeEntries, pivotVertex, pivotEdgeBits, operationCounters) {
  const projected = [];
  for (let i = 0; i < edgeEntries.length; i += 1) {
    if (operationCounters) {
      operationCounters.projectionEdgeScans += 1;
    }
    const edge = edgeEntries[i];
    if (bitsetHasVertex(edge.bits, pivotVertex)) {
      if (operationCounters) {
        operationCounters.projectionSkippedByPivot += 1;
      }
      continue;
    }
    if (operationCounters) {
      const wordOps = pivotEdgeBits.length;
      operationCounters.projectionEdgesCreated += 1;
      operationCounters.projectionWordOps += wordOps;
      operationCounters.projectionOps += wordOps;
    }
    projected.push({
      bits: bitsetAndNot(edge.bits, pivotEdgeBits),
      sourceEdgeIndex: edge.index
    });
  }
  return projected;
}

function describeWitness(violation, vertexLabels, edgeLabels) {
  if (!violation) {
    return null;
  }
  const pivotVertexLabel = vertexLabels[violation.pivotVertexIndex] || `V${violation.pivotVertexIndex + 1}`;
  const offendingVertexLabel = vertexLabels[violation.offendingVertexIndex] || `V${violation.offendingVertexIndex + 1}`;
  const pivotEdgeLabel = edgeLabels[violation.pivotEdgeIndex] || `E${violation.pivotEdgeIndex + 1}`;
  const offendingEdgeLabel = violation.offendingEdgeIndex >= 0
    ? (edgeLabels[violation.offendingEdgeIndex] || `E${violation.offendingEdgeIndex + 1}`)
    : "";

  return {
    pivotVertex: pivotVertexLabel,
    pivotEdge: pivotEdgeLabel,
    offendingVertex: offendingVertexLabel,
    offendingEdge: offendingEdgeLabel,
    message: offendingEdgeLabel
      ? `Naruszenie warunku XT dla v=${pivotVertexLabel}, H=${pivotEdgeLabel}, v'=${offendingVertexLabel}, H'=${offendingEdgeLabel}.`
      : `Naruszenie warunku XT dla v=${pivotVertexLabel}, H=${pivotEdgeLabel}, v'=${offendingVertexLabel}.`
  };
}

function emitProgress(onProgress, stage, total, message) {
  if (typeof onProgress === "function") {
    onProgress({
      stage,
      total,
      message
    });
  }
}

async function computeXtrec(payload, options) {
  const safePayload = payload || {};
  const onProgress = options && typeof options.onProgress === "function" ? options.onProgress : null;
  const matrix = Array.isArray(safePayload.matrix) ? safePayload.matrix : [];
  const rowLabels = Array.isArray(safePayload.rowLabels) ? safePayload.rowLabels.slice() : [];
  const colLabels = Array.isArray(safePayload.colLabels) ? safePayload.colLabels.slice() : [];
  const net = buildHypergraphFromMatrix(matrix, rowLabels, colLabels);
  const operationCounters = {
    essentialUnionOps: 0,
    essentialUnionWordOps: 0,
    starCellChecks: 0,
    starAssignments: 0,
    projectionEdgeScans: 0,
    projectionSkippedByPivot: 0,
    projectionEdgesCreated: 0,
    projectionWordOps: 0,
    projectionOps: 0,
    minUniqueInsertions: 0,
    minDuplicateEdges: 0,
    minPairComparisons: 0,
    minSubsetChecks: 0,
    minEqualsChecks: 0,
    minRemovedEdges: 0,
    veMaskUnionOps: 0,
    veMaskUnionWordOps: 0,
    intersectionChecks: 0,
    intersectionHits: 0,
    fallbackToCpuCount: 0
  };

  const edgeEntries = net.edgeEntries;
  const vertexCount = net.vertexCount;
  const edgeCount = edgeEntries.length;
  const vertexLabels = net.vertexLabels;
  const edgeLabels = edgeEntries.map((edge) => edge.label);

  const resolved = await resolveIntersectionEngine(safePayload.acceleration || "cpu");
  let accelerationUsed = resolved.used;
  let accelerationWarning = resolved.warning || "";
  let intersectionEngine = resolved.engine;

  if (accelerationWarning) {
    emitProgress(onProgress, 0, 1, accelerationWarning);
  }

  const startTs = nowMs();
  if (edgeCount === 0 || vertexCount === 0) {
    return {
      isXt: true,
      edgeCount,
      vertexCount,
      checksTotal: 0,
      checksPerformed: 0,
      witness: null,
      accelerationRequested: resolved.requested,
      accelerationUsed,
      accelerationWarning,
      runtimeMs: Math.max(0, nowMs() - startTs),
      operations: operationCounters
    };
  }

  const veMask = computeEssentialVertexMask(edgeEntries, net.wordCount, operationCounters);
  const veIndices = essentialVertexIndices(veMask, vertexCount);
  const stars = buildStarMap(edgeEntries, vertexCount, operationCounters);
  const totalChecks = veIndices.reduce((acc, vertexIndex) => acc + stars[vertexIndex].length, 0);

  let checksPerformed = 0;
  const progressEvery = Math.max(1, Math.floor(totalChecks / 25));
  let violation = null;

  for (let vPos = 0; vPos < veIndices.length; vPos += 1) {
    const pivotVertexIndex = veIndices[vPos];
    const starEdgeIndices = stars[pivotVertexIndex];
    if (!Array.isArray(starEdgeIndices) || starEdgeIndices.length === 0) {
      continue;
    }

    const fMask = new Uint32Array(net.wordCount);
    for (let i = 0; i < starEdgeIndices.length; i += 1) {
      bitsetOrInto(fMask, edgeEntries[starEdgeIndices[i]].bits);
    }

    const pivotChecks = [];
    for (let i = 0; i < starEdgeIndices.length; i += 1) {
      const pivotEdgeIndex = starEdgeIndices[i];
      const pivotEdgeBits = edgeEntries[pivotEdgeIndex].bits;

      const projected = buildProjectedEdges(edgeEntries, pivotVertexIndex, pivotEdgeBits, operationCounters);
      const minimized = minimizeProjectedEdges(projected, operationCounters);
      const veH0Mask = computeVeMaskFromProjectedEdges(minimized, net.wordCount, operationCounters);
      pivotChecks.push({
        pivotEdgeIndex,
        minimized,
        veH0Mask
      });
    }

    let intersections = [];
    try {
      operationCounters.intersectionChecks += pivotChecks.length;
      intersections = await intersectionEngine.intersectsMany(
        fMask,
        pivotChecks.map((item) => item.veH0Mask),
        net.wordCount,
        vertexCount
      );
    } catch (error) {
      if (accelerationUsed !== "cpu") {
        const fallbackReason = error instanceof Error ? error.message : tr("core.xtrec.accelerationUnknown");
        accelerationWarning = tr("core.xtrec.accelerationFallback", {
          engine: accelerationUsed.toUpperCase(),
          reason: fallbackReason
        });
        accelerationUsed = "cpu";
        intersectionEngine = createCpuIntersectionEngine();
        operationCounters.fallbackToCpuCount += 1;
        emitProgress(onProgress, checksPerformed, Math.max(totalChecks, 1), accelerationWarning);
        operationCounters.intersectionChecks += pivotChecks.length;
        intersections = await intersectionEngine.intersectsMany(
          fMask,
          pivotChecks.map((item) => item.veH0Mask),
          net.wordCount,
          vertexCount
        );
      } else {
        throw error;
      }
    }

    for (let i = 0; i < pivotChecks.length; i += 1) {
      const check = pivotChecks[i];
      checksPerformed += 1;
      if (
        checksPerformed === 1
        || checksPerformed === totalChecks
        || (checksPerformed % progressEvery) === 0
      ) {
        const pivotLabel = vertexLabels[pivotVertexIndex] || `V${pivotVertexIndex + 1}`;
        emitProgress(
          onProgress,
          checksPerformed,
          Math.max(totalChecks, 1),
          `XTREC: v=${pivotLabel}, test ${checksPerformed}/${Math.max(totalChecks, 1)}, tryb=${accelerationUsed.toUpperCase()}`
        );
      }

      if (intersections[i]) {
        operationCounters.intersectionHits += 1;
        const interMask = bitsetAnd(fMask, check.veH0Mask);
        const offendingVertexIndex = firstSetBitIndex(interMask, vertexCount);
        let offendingEdgeIndex = -1;
        if (offendingVertexIndex >= 0) {
          for (let h0Index = 0; h0Index < check.minimized.length; h0Index += 1) {
            if (bitsetHasVertex(check.minimized[h0Index].bits, offendingVertexIndex)) {
              offendingEdgeIndex = check.minimized[h0Index].sourceEdgeIndex;
              break;
            }
          }
        }

        violation = {
          pivotVertexIndex,
          pivotEdgeIndex: check.pivotEdgeIndex,
          offendingVertexIndex,
          offendingEdgeIndex
        };
        break;
      }
    }

    if (violation) {
      break;
    }
  }

  return {
    isXt: !violation,
    edgeCount,
    vertexCount,
    checksTotal: totalChecks,
    checksPerformed,
    witness: describeWitness(violation, vertexLabels, edgeLabels),
    accelerationRequested: resolved.requested,
    accelerationUsed,
    accelerationWarning,
    runtimeMs: Math.max(0, nowMs() - startTs),
    operations: operationCounters
  };
}

return {
  asInt,
  toBit,
  buildHypergraphFromMatrix,
  createCpuIntersectionEngine,
  resolveIntersectionEngine,
  describeWitness,
  computeXtrec
};
});
