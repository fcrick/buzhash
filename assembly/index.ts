/**
 * BuzHash over n bytes that creates a u32 hash.
 *
 * Based on https://github.com/silvasur/buzhash
 *
 * This is an experiment to write dynamically linkable AssemblyScript module
 * that uses minimal dynamic memory and a static data segment while being
 * agnostic to the allocator used.
 *
 * a buzhash needs:
 * - block size - this is the upper limit on how many bytes influence the value
 * of the hash.
 * - a circular buffer of block size bytes. We need to store these so we can
 * remove the least recent byte from the hash.
 * - current position in the circular buffer.
 * - whether or not the circular buffer has filled.
 * - 256 random u32 values - one for each possible input byte. This is the value
 * we xor into the hash. Note that this is completely static.
 *
 * Usage guide:
 * 1. Find 1024 bytes of memory and pass its address to staticInit.
 * 2. Decide on the block size of the hash.
 * 3. Call size(blockSize) to get the memory needed to run a hash of that block
 * size.
 * 4. Find that many bytes, and pass its address and the blockSize to init().
 * 5. Continualy call add with the same address and a byte to add to the hash.
 * Each call will return the current hash.
 */

/**
 * Layout of the header used to track the state of the hash. A buffer of
 * blockSize bytes immediately follows the header.
 */
@unmanaged class Header {
    state: u32;
    blockSize: u16;
    position: u16;
    overflow: u8;
}

/**
 * Returns space requirement for a given blockSize. Caller should ensure pointer
 * given to init provides this much spacs.
 **/
export function size(blockSize: u16): usize {
    return offsetof<Header>() + blockSize;
}

/**
 * Initialize a buzHash - dest should have size bytes available for our use.
 *
 * @param dest Where to put the getBuzHashSize bytes we'll use.
 * @param blockSize Number of bytes in block size.
 */
export function init(dest: usize, blockSize: u16): void {
    const buzHashHeader = changetype<Header>(dest);

    buzHashHeader.state = 0;
    buzHashHeader.blockSize = blockSize;
    buzHashHeader.position = 0;
    buzHashHeader.overflow = 0;
}

/**
 * Add a byte to an existing buzHash.
 *
 * @param byte The byte to add.
 * @param buzHash Pointer previously passed to init.
 */
export function add(buzHash: usize, byte: u8): u32 {
    const header = changetype<Header>(buzHash);
    const buffer = buzHash + offsetof<Header>();
    if (header.position === header.blockSize) {
        header.position = 0;
        header.overflow = 1;
    }

    let state = header.state;

    // barrel shift one to the left - use built in instruction :)
    state = rotl(state, 1);

    if (header.overflow) {
        // first get the byte we're removing from the hash
        const removed = load<u8>(buffer + header.position);

        // look up the static random value associated with that specific byte
        const random = load<u32>(staticData + removed);

        // to remove it, we need to xor it in, barrelshifted the right amount
        // so we're repeating/reversing the operation that introduced it.
        state ^= rotl(random, header.blockSize);
    }

    store<u8>(buffer + header.position, byte);
    header.position++;

    state ^= load<u32>(staticData + byte);
    header.state = state;

    return state;
}

const staticData = memory.data<u32>([
    0x12bd9527, 0xf4140cea, 0x987bd6e1, 0x79079850,
    0xafbfd539, 0xd350ce0a, 0x82973931, 0x9fc32b9c,
    0x28003b88, 0xc30c13aa, 0x6b678c34, 0x5844ef1d,
    0xaa552c18, 0x4a77d3e8, 0xd1f62ea0, 0x6599417c,
    0xfbe30e7a, 0xf9e2d5ee, 0xa1fca42e, 0x41548969,
    0x116d5b59, 0xaeda1e1a, 0xc5191c17, 0x54b9a3cb,
    0x727e492a, 0x5c432f91, 0x31a50bce, 0xc2696af6,
    0x217c8020, 0x1262aefc, 0xace75924, 0x9876a04f,
    0xaf300bc2, 0x3ffce3f6, 0xd6680fb5, 0xd0b1ced8,
    0x6651f842, 0x736fadef, 0xbc2d3429, 0xb03d2904,
    0x7e634ba4, 0xdfd87d8c, 0x7988d63a, 0x4be4d933,
    0x6a8d0382, 0x9e132d62, 0x3ee9c95f, 0xfec05b97,
    0x6907ad34, 0x8616cfcc, 0xa6aabf24, 0x8ad1c92e,
    0x4f2affc0, 0xb87519db, 0x6576eaf6, 0x15dbe00a,
    0x63e1dd82, 0xa36b6a81, 0xeead99b3, 0xbc6a4309,
    0x3478d1a7, 0x2182bcc0, 0xdd50cfce, 0x7cb25580,
    0x73075483, 0x503b7f42, 0x4cd50d63, 0x3f4d94c9,
    0x385fcbb7, 0x90daf16c, 0xece10b8e, 0x11c1cb04,
    0x816a899b, 0x69a29d06, 0xfb090b37, 0xf98ef13c,
    0x07653435, 0x9f15dc42, 0x3b43abdf, 0x1334283f,
    0x93f3d9af, 0x0cbdfe71, 0xa788a614, 0x4f54d2f0,
    0xd4374fc7, 0x70557ce7, 0xf741fce8, 0xe4b6f661,
    0xc630cb98, 0x387a6366, 0x72f428fd, 0x539009db,
    0xc53e3810, 0x1e1a52e5, 0x7d6816b0, 0x040f9b81,
    0x9c99c9fb, 0x9f3af3d2, 0x774d1061, 0xd5c840ea,
    0x8e1480fe, 0x6ee4023c, 0x2fbda535, 0xd88eff7a,
    0xd8632a2a, 0x43c4e024, 0x3ef27971, 0xc72866fd,
    0xe35cc630, 0x46d96220, 0x437a8384, 0xe92caf0c,
    0x6290a47e, 0xa7bb9238, 0x0e1000f9, 0x49e76bdc,
    0x3acfb4b8, 0x03582b8e, 0x6ea2de4e, 0x2ec1008d,
    0xfcc8df69, 0x91c2fe0a, 0xb471c7d9, 0x778be812,
    0x70d29ad1, 0x76411cbf, 0xc302e81c, 0x4e445194,
    0x22e3aa72, 0xb65762e9, 0xa280db05, 0x827aa70e,
    0x4c531a9d, 0x7a60bf4a, 0x8fd95a44, 0x2289aef0,
    0xcd50ddc4, 0x639aae69, 0x5fe85ed6, 0x4ed724ff,
    0x00f04f7d, 0x95a5fcb0, 0x88255d15, 0xa603d2c9,
    0xf6956a5b, 0x53ea7f3e, 0xb570f225, 0x2b3be203,
    0xa181e40e, 0xc413cdce, 0xa7cb1ebb, 0xcf258b1f,
    0x516eb016, 0xca204586, 0xd1e69894, 0xe85a73d3,
    0x7db2d382, 0xae73b463, 0x3598d643, 0x5087c864,
    0xd91f30b6, 0xe1d4d1e7, 0x73b3b337, 0xceac1233,
    0x8edf7845, 0xa69c45c9, 0xdb5db3ab, 0x28cfade8,
    0xebfa49e7, 0xcbc2a659, 0x59cce971, 0x959a01af,
    0x8ee9aae7, 0xfb2f01c6, 0x5a752836, 0x9ed12981,
    0x618d05b6, 0x93ec12b3, 0x4590c779, 0xed1317a2,
    0x03fe5835, 0x7ad3c6f7, 0xd4aad5b5, 0x1a995ed7,
    0x247bfaa4, 0x69c2c799, 0x745fa405, 0xc5b9f239,
    0xc3d9aebc, 0xa6f60e0b, 0xdf1e91d7, 0xab8e041c,
    0xee3188c6, 0x37377a9e, 0xc0e1a3bf, 0x19a5a9e4,
    0x56cb9556, 0xc4d33d3f, 0xfb1eb03e, 0xf9557057,
    0x1be31d37, 0xd1fa65f1, 0xf518d714, 0x570ac722,
    0xf26cf66a, 0x24794d47, 0x8ba2e402, 0x3f5137e6,
    0x35be1453, 0x43350478, 0x9f05ee88, 0x364cf9cf,
    0x39a23ee7, 0xa4db8d49, 0xc2ebb3d2, 0xc6fb99d5,
    0xe014dfb0, 0x7156d425, 0xe090a87a, 0x4cc12f78,
    0x1b30f503, 0x06694a7a, 0x68198cd1, 0x2f8345bd,
    0x9d79198e, 0xd871943f, 0x22ef6cf4, 0xe81b1c15,
    0x067b61d8, 0xfc4ea4f5, 0xfe6dab57, 0x1bf744ba,
    0xa70b6a25, 0xafe6e412, 0xc6c1a05c, 0x8ffbe3ce,
    0xc4270af1, 0xf3f36373, 0xc4507dd8, 0x5e6fd1e2,
    0x58cd9739, 0x47d3c5b5, 0xe1d5a343, 0x3d4dea4a,
    0x893d91ae, 0xbb2a5e2a, 0x0d57b800, 0x652a7cc9,
    0x6a68ccfd, 0x62529f0b, 0xec5f36d6, 0x766cceda,
    0x96ca63ef, 0xa0499838, 0xd9030f59, 0x8185f4d2,
]);
