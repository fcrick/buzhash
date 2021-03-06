const assert = require("assert");

const memory = new WebAssembly.Memory({initial:1});
const {
    add,
    init,
    staticInit,
    size,
} = require('..')({env:{memory:memory}});

const buffer = memory.buffer;
const staticAddr = 0;

// fill first 1024 bytes with static data
const staticSize = staticInit(staticAddr);
assert.equal(staticSize, 1024, `${staticSize} bytes used`);

const buzAddr = staticAddr + staticSize;

findPhrase('Aenean massa. Cum sociis natoque')
findPhrase('Aliquam lorem ante');

console.log("ok");

function findPhrase(phrase) {
    const blockSize = phrase.length;

    init(buzAddr, blockSize);

    const expectedSize = blockSize + 9;
    assert.equal(size(blockSize), expectedSize, `size should be ${expectedSize}`);

    let phraseHash = 0;
    for (let i = 0; i < phrase.length; ++i) {
        phraseHash = add(buzAddr, phrase.charCodeAt(i));
    }

    const loremipsum = `Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
    Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et
    magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis,
    ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis
    enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In
    enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis
    eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum
    semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu,
    consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra
    quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet.
    Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur
    ullamcorper ultricies nisi. Nam eget dui.

    Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper
    libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel,
    luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt
    tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam
    sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit
    amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum
    sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce
    vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed,
    nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis
    hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et
    ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia.`;

    // reset our buz hash
    init(buzAddr, blockSize);

    let found = false;
    for (let i = 0; i < loremipsum.length; ++i) {
        const hash = add(buzAddr, loremipsum.charCodeAt(i));
        if (hash === phraseHash) {
            found = true;
            break;
        }
    }

    assert.equal(found, true, `Phrase not found`);
}


