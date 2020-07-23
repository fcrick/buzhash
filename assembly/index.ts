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
 * Location our static data was saved to when init was called. We store this
 * in a global so it doesn't need to be passed to add.
 **/
// @ts-ignore: decorator
@global let staticData = usize.MAX_VALUE;

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

/**
 * To make this usable as a dynamically linked module that uses memory another
 * module owns, we have to just copy our constants somewhere we're told to put
 * them. This likely can be migrated to a passive data segment once that
 * proposal rolls out. It's not yet clear if that will just make this cleaner or
 * eliminate static initialization completely.
 *
 * Call to initialize this module's static data at the given location. Call with
 * -1 to return the anticipated size of the static data only. This function can
 * be called multiple times if desired - the most recent location will be stored
 * in a global variable. It's possible that once threading is introduced, each
 * thread using this module will need to call staticInit, even if the locations
 * are the same, as mutable globals are thread-local.
 *
 * Returns the size of this module's static data.
 */
export function staticInit(dest: usize): usize {
    if (dest === -1) {
        // return anticipated size but do nothing.
        return 1024;
    }
    let p: usize = dest;
    store<u32>(p, 0x12bd9527); p += 4;
    store<u32>(p, 0xf4140cea); p += 4;
    store<u32>(p, 0x987bd6e1); p += 4;
    store<u32>(p, 0x79079850); p += 4;
    store<u32>(p, 0xafbfd539); p += 4;
    store<u32>(p, 0xd350ce0a); p += 4;
    store<u32>(p, 0x82973931); p += 4;
    store<u32>(p, 0x9fc32b9c); p += 4;
    store<u32>(p, 0x28003b88); p += 4;
    store<u32>(p, 0xc30c13aa); p += 4;
    store<u32>(p, 0x6b678c34); p += 4;
    store<u32>(p, 0x5844ef1d); p += 4;
    store<u32>(p, 0xaa552c18); p += 4;
    store<u32>(p, 0x4a77d3e8); p += 4;
    store<u32>(p, 0xd1f62ea0); p += 4;
    store<u32>(p, 0x6599417c); p += 4;
    store<u32>(p, 0xfbe30e7a); p += 4;
    store<u32>(p, 0xf9e2d5ee); p += 4;
    store<u32>(p, 0xa1fca42e); p += 4;
    store<u32>(p, 0x41548969); p += 4;
    store<u32>(p, 0x116d5b59); p += 4;
    store<u32>(p, 0xaeda1e1a); p += 4;
    store<u32>(p, 0xc5191c17); p += 4;
    store<u32>(p, 0x54b9a3cb); p += 4;
    store<u32>(p, 0x727e492a); p += 4;
    store<u32>(p, 0x5c432f91); p += 4;
    store<u32>(p, 0x31a50bce); p += 4;
    store<u32>(p, 0xc2696af6); p += 4;
    store<u32>(p, 0x217c8020); p += 4;
    store<u32>(p, 0x1262aefc); p += 4;
    store<u32>(p, 0xace75924); p += 4;
    store<u32>(p, 0x9876a04f); p += 4;
    store<u32>(p, 0xaf300bc2); p += 4;
    store<u32>(p, 0x3ffce3f6); p += 4;
    store<u32>(p, 0xd6680fb5); p += 4;
    store<u32>(p, 0xd0b1ced8); p += 4;
    store<u32>(p, 0x6651f842); p += 4;
    store<u32>(p, 0x736fadef); p += 4;
    store<u32>(p, 0xbc2d3429); p += 4;
    store<u32>(p, 0xb03d2904); p += 4;
    store<u32>(p, 0x7e634ba4); p += 4;
    store<u32>(p, 0xdfd87d8c); p += 4;
    store<u32>(p, 0x7988d63a); p += 4;
    store<u32>(p, 0x4be4d933); p += 4;
    store<u32>(p, 0x6a8d0382); p += 4;
    store<u32>(p, 0x9e132d62); p += 4;
    store<u32>(p, 0x3ee9c95f); p += 4;
    store<u32>(p, 0xfec05b97); p += 4;
    store<u32>(p, 0x6907ad34); p += 4;
    store<u32>(p, 0x8616cfcc); p += 4;
    store<u32>(p, 0xa6aabf24); p += 4;
    store<u32>(p, 0x8ad1c92e); p += 4;
    store<u32>(p, 0x4f2affc0); p += 4;
    store<u32>(p, 0xb87519db); p += 4;
    store<u32>(p, 0x6576eaf6); p += 4;
    store<u32>(p, 0x15dbe00a); p += 4;
    store<u32>(p, 0x63e1dd82); p += 4;
    store<u32>(p, 0xa36b6a81); p += 4;
    store<u32>(p, 0xeead99b3); p += 4;
    store<u32>(p, 0xbc6a4309); p += 4;
    store<u32>(p, 0x3478d1a7); p += 4;
    store<u32>(p, 0x2182bcc0); p += 4;
    store<u32>(p, 0xdd50cfce); p += 4;
    store<u32>(p, 0x7cb25580); p += 4;
    store<u32>(p, 0x73075483); p += 4;
    store<u32>(p, 0x503b7f42); p += 4;
    store<u32>(p, 0x4cd50d63); p += 4;
    store<u32>(p, 0x3f4d94c9); p += 4;
    store<u32>(p, 0x385fcbb7); p += 4;
    store<u32>(p, 0x90daf16c); p += 4;
    store<u32>(p, 0xece10b8e); p += 4;
    store<u32>(p, 0x11c1cb04); p += 4;
    store<u32>(p, 0x816a899b); p += 4;
    store<u32>(p, 0x69a29d06); p += 4;
    store<u32>(p, 0xfb090b37); p += 4;
    store<u32>(p, 0xf98ef13c); p += 4;
    store<u32>(p, 0x07653435); p += 4;
    store<u32>(p, 0x9f15dc42); p += 4;
    store<u32>(p, 0x3b43abdf); p += 4;
    store<u32>(p, 0x1334283f); p += 4;
    store<u32>(p, 0x93f3d9af); p += 4;
    store<u32>(p, 0x0cbdfe71); p += 4;
    store<u32>(p, 0xa788a614); p += 4;
    store<u32>(p, 0x4f54d2f0); p += 4;
    store<u32>(p, 0xd4374fc7); p += 4;
    store<u32>(p, 0x70557ce7); p += 4;
    store<u32>(p, 0xf741fce8); p += 4;
    store<u32>(p, 0xe4b6f661); p += 4;
    store<u32>(p, 0xc630cb98); p += 4;
    store<u32>(p, 0x387a6366); p += 4;
    store<u32>(p, 0x72f428fd); p += 4;
    store<u32>(p, 0x539009db); p += 4;
    store<u32>(p, 0xc53e3810); p += 4;
    store<u32>(p, 0x1e1a52e5); p += 4;
    store<u32>(p, 0x7d6816b0); p += 4;
    store<u32>(p, 0x040f9b81); p += 4;
    store<u32>(p, 0x9c99c9fb); p += 4;
    store<u32>(p, 0x9f3af3d2); p += 4;
    store<u32>(p, 0x774d1061); p += 4;
    store<u32>(p, 0xd5c840ea); p += 4;
    store<u32>(p, 0x8e1480fe); p += 4;
    store<u32>(p, 0x6ee4023c); p += 4;
    store<u32>(p, 0x2fbda535); p += 4;
    store<u32>(p, 0xd88eff7a); p += 4;
    store<u32>(p, 0xd8632a2a); p += 4;
    store<u32>(p, 0x43c4e024); p += 4;
    store<u32>(p, 0x3ef27971); p += 4;
    store<u32>(p, 0xc72866fd); p += 4;
    store<u32>(p, 0xe35cc630); p += 4;
    store<u32>(p, 0x46d96220); p += 4;
    store<u32>(p, 0x437a8384); p += 4;
    store<u32>(p, 0xe92caf0c); p += 4;
    store<u32>(p, 0x6290a47e); p += 4;
    store<u32>(p, 0xa7bb9238); p += 4;
    store<u32>(p, 0x0e1000f9); p += 4;
    store<u32>(p, 0x49e76bdc); p += 4;
    store<u32>(p, 0x3acfb4b8); p += 4;
    store<u32>(p, 0x03582b8e); p += 4;
    store<u32>(p, 0x6ea2de4e); p += 4;
    store<u32>(p, 0x2ec1008d); p += 4;
    store<u32>(p, 0xfcc8df69); p += 4;
    store<u32>(p, 0x91c2fe0a); p += 4;
    store<u32>(p, 0xb471c7d9); p += 4;
    store<u32>(p, 0x778be812); p += 4;
    store<u32>(p, 0x70d29ad1); p += 4;
    store<u32>(p, 0x76411cbf); p += 4;
    store<u32>(p, 0xc302e81c); p += 4;
    store<u32>(p, 0x4e445194); p += 4;
    store<u32>(p, 0x22e3aa72); p += 4;
    store<u32>(p, 0xb65762e9); p += 4;
    store<u32>(p, 0xa280db05); p += 4;
    store<u32>(p, 0x827aa70e); p += 4;
    store<u32>(p, 0x4c531a9d); p += 4;
    store<u32>(p, 0x7a60bf4a); p += 4;
    store<u32>(p, 0x8fd95a44); p += 4;
    store<u32>(p, 0x2289aef0); p += 4;
    store<u32>(p, 0xcd50ddc4); p += 4;
    store<u32>(p, 0x639aae69); p += 4;
    store<u32>(p, 0x5fe85ed6); p += 4;
    store<u32>(p, 0x4ed724ff); p += 4;
    store<u32>(p, 0x00f04f7d); p += 4;
    store<u32>(p, 0x95a5fcb0); p += 4;
    store<u32>(p, 0x88255d15); p += 4;
    store<u32>(p, 0xa603d2c9); p += 4;
    store<u32>(p, 0xf6956a5b); p += 4;
    store<u32>(p, 0x53ea7f3e); p += 4;
    store<u32>(p, 0xb570f225); p += 4;
    store<u32>(p, 0x2b3be203); p += 4;
    store<u32>(p, 0xa181e40e); p += 4;
    store<u32>(p, 0xc413cdce); p += 4;
    store<u32>(p, 0xa7cb1ebb); p += 4;
    store<u32>(p, 0xcf258b1f); p += 4;
    store<u32>(p, 0x516eb016); p += 4;
    store<u32>(p, 0xca204586); p += 4;
    store<u32>(p, 0xd1e69894); p += 4;
    store<u32>(p, 0xe85a73d3); p += 4;
    store<u32>(p, 0x7db2d382); p += 4;
    store<u32>(p, 0xae73b463); p += 4;
    store<u32>(p, 0x3598d643); p += 4;
    store<u32>(p, 0x5087c864); p += 4;
    store<u32>(p, 0xd91f30b6); p += 4;
    store<u32>(p, 0xe1d4d1e7); p += 4;
    store<u32>(p, 0x73b3b337); p += 4;
    store<u32>(p, 0xceac1233); p += 4;
    store<u32>(p, 0x8edf7845); p += 4;
    store<u32>(p, 0xa69c45c9); p += 4;
    store<u32>(p, 0xdb5db3ab); p += 4;
    store<u32>(p, 0x28cfade8); p += 4;
    store<u32>(p, 0xebfa49e7); p += 4;
    store<u32>(p, 0xcbc2a659); p += 4;
    store<u32>(p, 0x59cce971); p += 4;
    store<u32>(p, 0x959a01af); p += 4;
    store<u32>(p, 0x8ee9aae7); p += 4;
    store<u32>(p, 0xfb2f01c6); p += 4;
    store<u32>(p, 0x5a752836); p += 4;
    store<u32>(p, 0x9ed12981); p += 4;
    store<u32>(p, 0x618d05b6); p += 4;
    store<u32>(p, 0x93ec12b3); p += 4;
    store<u32>(p, 0x4590c779); p += 4;
    store<u32>(p, 0xed1317a2); p += 4;
    store<u32>(p, 0x03fe5835); p += 4;
    store<u32>(p, 0x7ad3c6f7); p += 4;
    store<u32>(p, 0xd4aad5b5); p += 4;
    store<u32>(p, 0x1a995ed7); p += 4;
    store<u32>(p, 0x247bfaa4); p += 4;
    store<u32>(p, 0x69c2c799); p += 4;
    store<u32>(p, 0x745fa405); p += 4;
    store<u32>(p, 0xc5b9f239); p += 4;
    store<u32>(p, 0xc3d9aebc); p += 4;
    store<u32>(p, 0xa6f60e0b); p += 4;
    store<u32>(p, 0xdf1e91d7); p += 4;
    store<u32>(p, 0xab8e041c); p += 4;
    store<u32>(p, 0xee3188c6); p += 4;
    store<u32>(p, 0x37377a9e); p += 4;
    store<u32>(p, 0xc0e1a3bf); p += 4;
    store<u32>(p, 0x19a5a9e4); p += 4;
    store<u32>(p, 0x56cb9556); p += 4;
    store<u32>(p, 0xc4d33d3f); p += 4;
    store<u32>(p, 0xfb1eb03e); p += 4;
    store<u32>(p, 0xf9557057); p += 4;
    store<u32>(p, 0x1be31d37); p += 4;
    store<u32>(p, 0xd1fa65f1); p += 4;
    store<u32>(p, 0xf518d714); p += 4;
    store<u32>(p, 0x570ac722); p += 4;
    store<u32>(p, 0xf26cf66a); p += 4;
    store<u32>(p, 0x24794d47); p += 4;
    store<u32>(p, 0x8ba2e402); p += 4;
    store<u32>(p, 0x3f5137e6); p += 4;
    store<u32>(p, 0x35be1453); p += 4;
    store<u32>(p, 0x43350478); p += 4;
    store<u32>(p, 0x9f05ee88); p += 4;
    store<u32>(p, 0x364cf9cf); p += 4;
    store<u32>(p, 0x39a23ee7); p += 4;
    store<u32>(p, 0xa4db8d49); p += 4;
    store<u32>(p, 0xc2ebb3d2); p += 4;
    store<u32>(p, 0xc6fb99d5); p += 4;
    store<u32>(p, 0xe014dfb0); p += 4;
    store<u32>(p, 0x7156d425); p += 4;
    store<u32>(p, 0xe090a87a); p += 4;
    store<u32>(p, 0x4cc12f78); p += 4;
    store<u32>(p, 0x1b30f503); p += 4;
    store<u32>(p, 0x06694a7a); p += 4;
    store<u32>(p, 0x68198cd1); p += 4;
    store<u32>(p, 0x2f8345bd); p += 4;
    store<u32>(p, 0x9d79198e); p += 4;
    store<u32>(p, 0xd871943f); p += 4;
    store<u32>(p, 0x22ef6cf4); p += 4;
    store<u32>(p, 0xe81b1c15); p += 4;
    store<u32>(p, 0x067b61d8); p += 4;
    store<u32>(p, 0xfc4ea4f5); p += 4;
    store<u32>(p, 0xfe6dab57); p += 4;
    store<u32>(p, 0x1bf744ba); p += 4;
    store<u32>(p, 0xa70b6a25); p += 4;
    store<u32>(p, 0xafe6e412); p += 4;
    store<u32>(p, 0xc6c1a05c); p += 4;
    store<u32>(p, 0x8ffbe3ce); p += 4;
    store<u32>(p, 0xc4270af1); p += 4;
    store<u32>(p, 0xf3f36373); p += 4;
    store<u32>(p, 0xc4507dd8); p += 4;
    store<u32>(p, 0x5e6fd1e2); p += 4;
    store<u32>(p, 0x58cd9739); p += 4;
    store<u32>(p, 0x47d3c5b5); p += 4;
    store<u32>(p, 0xe1d5a343); p += 4;
    store<u32>(p, 0x3d4dea4a); p += 4;
    store<u32>(p, 0x893d91ae); p += 4;
    store<u32>(p, 0xbb2a5e2a); p += 4;
    store<u32>(p, 0x0d57b800); p += 4;
    store<u32>(p, 0x652a7cc9); p += 4;
    store<u32>(p, 0x6a68ccfd); p += 4;
    store<u32>(p, 0x62529f0b); p += 4;
    store<u32>(p, 0xec5f36d6); p += 4;
    store<u32>(p, 0x766cceda); p += 4;
    store<u32>(p, 0x96ca63ef); p += 4;
    store<u32>(p, 0xa0499838); p += 4;
    store<u32>(p, 0xd9030f59); p += 4;
    store<u32>(p, 0x8185f4d2); p += 4;

    staticData = dest;

    return p - dest;
}
